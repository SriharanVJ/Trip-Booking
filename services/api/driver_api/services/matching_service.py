"""Driver matching (spec 4.3).

Per booking, an asyncio task runs dispatch rounds:
  1. Geo-search online drivers around the pickup (Redis GEO index, in-memory
     fallback keeps this working without Redis).
  2. Re-filter candidates against the DB each round (is_online, verified,
     no active trip) — covers drivers who go offline mid-search (spec 6).
  3. Push `booking:new_request` (privacy-coarsened payload) to up to
     BATCH_SIZE nearest drivers; drivers accept via REST (race-safe).
  4. Wait, then re-check; radius expands each attempt up to the cap.

NOTE: search state lives in this process (like the rest of the app). For a
multi-instance deployment move the loop to Celery + Redis bookkeeping —
the DB state machine below stays unchanged.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.core.config import settings
from driver_api.core.db import AsyncSessionLocal
from driver_api.core.redis import DRIVERS_GEO_KEY, redis_service
from driver_api.models import Booking, BookingStatus, Driver, VerificationStatus
from driver_api.sockets.events import emit, emit_many
from driver_api.services.queries import BOOKING_LOAD_OPTIONS, log_status
from driver_api.utils.serializers import serialize_booking

logger = logging.getLogger(__name__)

# How far back boot recovery will re-kick an unassigned `searching` booking.
# The search loop itself only lives ~3 min (6 rounds × 30 s), so anything
# older than an hour is a stray, not a live search — re-offering a days-old
# request to drivers would be a surprise.
_SEARCH_RESUME_WINDOW = timedelta(hours=1)


class MatchingService:
    def __init__(self) -> None:
        self._tasks: dict[uuid.UUID, asyncio.Task] = {}
        self._opted_out: dict[uuid.UUID, set[uuid.UUID]] = {}

    # ---- lifecycle -------------------------------------------------------

    def start_search(self, booking_id: uuid.UUID) -> None:
        if (task := self._tasks.get(booking_id)) and not task.done():
            return
        self._tasks[booking_id] = asyncio.create_task(self._search_loop(booking_id))

    def stop_search(self, booking_id: uuid.UUID) -> None:
        task = self._tasks.pop(booking_id, None)
        if task and not task.done():
            task.cancel()

    def opt_out(self, booking_id: uuid.UUID, driver_user_id: uuid.UUID) -> None:
        """Driver rejected a pre-assignment offer — never re-offer this booking."""
        self._opted_out.setdefault(booking_id, set()).add(driver_user_id)

    async def resume_orphaned_searches(self) -> int:
        """Boot-time recovery: the per-booking search tasks live in this
        process, so a restart leaves `searching` bookings with no loop —
        they poll forever, never match, never fire no_drivers. Re-kick the
        recent unassigned ones."""
        cutoff = datetime.now(timezone.utc) - _SEARCH_RESUME_WINDOW
        async with AsyncSessionLocal() as db:
            booking_ids = (await db.execute(
                select(Booking.id).where(
                    Booking.status.in_([BookingStatus.REQUESTED, BookingStatus.SEARCHING]),
                    Booking.driver_id.is_(None),
                    Booking.requested_at >= cutoff,
                )
            )).scalars().all()
        for booking_id in booking_ids:
            self.start_search(booking_id)
        return len(booking_ids)

    # ---- dispatch loop ---------------------------------------------------

    async def _search_loop(self, booking_id: uuid.UUID) -> None:
        try:
            for attempt in range(settings.matching_max_attempts):
                radius = min(
                    settings.matching_initial_radius_km + settings.matching_radius_step_km * attempt,
                    settings.matching_max_radius_km,
                )
                keep_going = await self._dispatch_round(booking_id, attempt, radius)
                if not keep_going:
                    return
                await asyncio.sleep(settings.matching_request_timeout_seconds)
            await self._notify_no_drivers(booking_id)
        except asyncio.CancelledError:
            pass  # booking assigned/cancelled — stop_search() cancelled us
        except Exception:  # pragma: no cover - defensive: never kill the app
            logger.exception("Matching loop crashed for booking %s", booking_id)
        finally:
            self._tasks.pop(booking_id, None)
            self._opted_out.pop(booking_id, None)

    async def _dispatch_round(self, booking_id: uuid.UUID, attempt: int, radius_km: float) -> bool:
        """One offer round. Returns False when the search should stop."""
        async with AsyncSessionLocal() as db:
            booking = (
                await db.execute(
                    select(Booking).where(Booking.id == booking_id).options(*BOOKING_LOAD_OPTIONS)
                )
            ).scalar_one_or_none()
            if booking is None or booking.status not in (BookingStatus.REQUESTED, BookingStatus.SEARCHING):
                return False  # assigned or cancelled elsewhere

            if attempt == 0 and booking.status is BookingStatus.REQUESTED:
                booking.status = BookingStatus.SEARCHING
                db.add(log_status(booking.id, BookingStatus.SEARCHING, "Matching started"))
                await db.commit()

            candidates = await self._candidate_drivers(db, booking, radius_km)
            if candidates:
                payload = serialize_booking(booking, viewer="driver", reveal=False)
                # Wrapped like booking:accepted — the driver panel reads
                # data["booking"] (simple notification events stay flat).
                await emit_many(
                    [driver.user_id for driver in candidates],
                    "booking:new_request",
                    {"booking": payload},
                )
            return True

    async def _notify_no_drivers(self, booking_id: uuid.UUID) -> None:
        async with AsyncSessionLocal() as db:
            booking = (
                await db.execute(
                    select(Booking)
                    .where(Booking.id == booking_id)
                    .options(*BOOKING_LOAD_OPTIONS)
                )
            ).scalar_one_or_none()
            # Status stays `searching` — the customer may cancel or wait for
            # drivers to come online; the frontend surfaces the event.
            if booking and booking.status in (BookingStatus.REQUESTED, BookingStatus.SEARCHING):
                await emit(
                    booking.customer.user_id,
                    "booking:no_drivers",
                    {
                        "booking_id": str(booking.id),
                        "message": "No drivers available right now. You can keep waiting or cancel the booking.",
                    },
                )

    # ---- candidate selection --------------------------------------------

    async def _candidate_drivers(self, db: AsyncSession, booking: Booking,
                                 radius_km: float) -> list[Driver]:
        """Geo-index shortlist re-checked against DB truth (fresh filters)."""
        nearby = await redis_service.geo.geosearch(
            DRIVERS_GEO_KEY,
            longitude=booking.pickup_lng,
            latitude=booking.pickup_lat,
            radius_km=radius_km,
        )  # [(member=user_id, dist_km)] sorted nearest-first
        if not nearby:
            return []

        skip = self._opted_out.get(booking.id, set())
        rows = (
            await db.execute(
                select(Driver)
                .where(
                    Driver.user_id.in_([member for member, _ in nearby]),
                    Driver.is_online.is_(True),
                    Driver.is_verified.is_(True),
                    Driver.verification_status == VerificationStatus.APPROVED,
                    Driver.current_lat.isnot(None),
                    Driver.current_lng.isnot(None),
                    # exclude drivers already on an active trip
                    ~select(Booking.id)
                    .where(
                        Booking.driver_id == Driver.id,
                        Booking.status.in_(
                            [BookingStatus.DRIVER_ASSIGNED, BookingStatus.TRIP_STARTED]
                        ),
                    )
                    .exists(),
                )
            )
        ).scalars().all()

        distance_by_user = {member: dist for member, dist in nearby}
        eligible = [
            driver
            for driver in rows
            if driver.user_id not in skip
        ]
        eligible.sort(key=lambda d: distance_by_user.get(str(d.user_id), 999.0))
        return eligible[: settings.matching_batch_size]


matching_service = MatchingService()
