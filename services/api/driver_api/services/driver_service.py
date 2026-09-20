"""Driver profile, documents, online status, location pings."""

from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from driver_api.core.config import settings
from driver_api.core.redis import DRIVERS_GEO_KEY, redis_service
from driver_api.models import Booking, BookingStatus, Driver, VerificationStatus
from driver_api.services.auth_service import ensure_email_available
from driver_api.sockets.events import emit
from driver_api.utils.email import normalize_email
from driver_api.utils.errors import AppError

_ACTIVE_TRIP_STATUSES = (BookingStatus.DRIVER_ASSIGNED, BookingStatus.TRIP_STARTED)


def serialize_driver(driver: Driver) -> dict:
    return {
        "driver_id": str(driver.id),
        "user_id": str(driver.user_id),
        "name": driver.user.name,
        "phone": driver.user.phone,
        "email": driver.user.email,
        "license_no": driver.license_no,
        "license_doc_url": driver.license_doc_url,
        "is_verified": driver.is_verified,
        "verification_status": driver.verification_status.value,
        "is_online": driver.is_online,
        "current_lat": driver.current_lat,
        "current_lng": driver.current_lng,
        "rating_avg": float(driver.rating_avg or 0),
        "total_trips": driver.total_trips,
        "cancellation_count": driver.cancellation_count,
        "created_by": driver.created_by.value,
        "created_at": driver.created_at.isoformat() if driver.created_at else None,
    }


async def update_profile(db: AsyncSession, driver: Driver, *,
                         name: str | None = None,
                         license_no: str | None = None,
                         email: str | None = None) -> dict:
    if name is not None:
        driver.user.name = name
    if license_no is not None:
        driver.license_no = license_no
    if email is not None:
        email = normalize_email(email)
        # Own phone is excluded, so re-saving the current address is a no-op.
        await ensure_email_available(db, email=email, phone=driver.user.phone)
        driver.user.email = email
    await db.commit()
    return serialize_driver(driver)


async def upload_document(db: AsyncSession, driver: Driver,
                          original_name: str, content: bytes) -> dict:
    """Store the license doc locally and reset verification to pending.

    Local disk keeps the POC self-contained; swap the storage lines for
    S3/Cloudinary when ready (the request/response contract stays the same).
    """
    if not content:
        raise AppError.bad_request("Empty file")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    suffix = Path(original_name).suffix or ".bin"
    dest = upload_dir / f"{driver.id}{suffix}"
    dest.write_bytes(content)

    driver.license_doc_url = f"/uploads/{dest.name}"
    driver.verification_status = VerificationStatus.PENDING
    driver.is_verified = False
    await db.commit()
    return serialize_driver(driver)


async def set_online_status(db: AsyncSession, driver: Driver, is_online: bool) -> dict:
    if is_online and not (driver.is_verified
                          and driver.verification_status is VerificationStatus.APPROVED):
        raise AppError.forbidden("Your account is not verified yet.")
    if is_online and (driver.current_lat is None or driver.current_lng is None):
        raise AppError.bad_request("Send a location update before going online.")

    driver.is_online = is_online
    if is_online:
        await redis_service.geo.geoadd(
            DRIVERS_GEO_KEY, str(driver.user_id), driver.current_lng, driver.current_lat
        )
    else:
        # Leaves the matching pool immediately, even mid-search (spec 6)
        await redis_service.geo.zrem(DRIVERS_GEO_KEY, str(driver.user_id))
    await db.commit()
    return serialize_driver(driver)


async def update_location(db: AsyncSession, driver: Driver, lat: float, lng: float) -> dict:
    """Frequent ping from the driver app: persist + keep the geo index warm +
    stream to the customer while a trip is active (spec 5 driver:location_update)."""
    driver.current_lat = lat
    driver.current_lng = lng
    if driver.is_online:
        await redis_service.geo.geoadd(DRIVERS_GEO_KEY, str(driver.user_id), lng, lat)

    booking = (
        await db.execute(
            select(Booking)
            .where(Booking.driver_id == driver.id,
                   Booking.status.in_(_ACTIVE_TRIP_STATUSES))
            .options(selectinload(Booking.customer))
            .limit(1)
        )
    ).scalar_one_or_none()

    await db.commit()
    if booking is not None:
        await emit(booking.customer.user_id, "driver:location_update", {
            "booking_id": str(booking.id),
            "lat": lat,
            "lng": lng,
        })
    return {"lat": lat, "lng": lng, "updated": True}


async def handle_disconnect(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Safety net for a driver whose socket went away (logout, tab close,
    crash): take them out of the matching pool so live searches stop picking
    a ghost. Mid-trip drivers stay online — they're on a job, and a flaky
    connection shouldn't flip their dashboard to offline."""
    driver = (await db.execute(
        select(Driver).where(Driver.user_id == user_id)
    )).scalar_one_or_none()
    if driver is None or not driver.is_online:
        return
    on_trip = (await db.execute(
        select(Booking.id).where(
            Booking.driver_id == driver.id,
            Booking.status.in_(_ACTIVE_TRIP_STATUSES),
        ).limit(1)
    )).scalar_one_or_none()
    if on_trip is not None:
        return
    driver.is_online = False
    await redis_service.geo.zrem(DRIVERS_GEO_KEY, str(user_id))
    await db.commit()


async def handle_reconnect(db: AsyncSession, user_id: uuid.UUID) -> None:
    """Socket (re)established for a driver the DB still considers online —
    put them back into the matching geo index. The index is in-memory in
    single-instance dev, so a backend restart empties it while `is_online`
    stays true in the DB; without this, searches find nobody until the
    driver toggles offline→online by hand."""
    driver = (await db.execute(
        select(Driver).where(Driver.user_id == user_id)
    )).scalar_one_or_none()
    if (driver is None or not driver.is_online
            or driver.current_lat is None or driver.current_lng is None):
        return
    await redis_service.geo.geoadd(
        DRIVERS_GEO_KEY, str(driver.user_id), driver.current_lng, driver.current_lat
    )


async def rewarm_geo_index(db: AsyncSession) -> int:
    """Boot-time companion to handle_reconnect: repopulate the index straight
    from the DB so online drivers are matchable immediately — including those
    whose panel isn't open (yet) to trigger a reconnect re-warm."""
    drivers = (await db.execute(
        select(Driver).where(
            Driver.is_online.is_(True),
            Driver.current_lat.isnot(None),
            Driver.current_lng.isnot(None),
        )
    )).scalars().all()
    for driver in drivers:
        await redis_service.geo.geoadd(
            DRIVERS_GEO_KEY, str(driver.user_id), driver.current_lng, driver.current_lat
        )
    return len(drivers)
