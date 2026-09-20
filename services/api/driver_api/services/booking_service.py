"""Booking business logic: create → match → accept → trip → complete/cancel,
plus ratings, history and dues (specs 4.1–4.5, 6)."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.models import (
    Booking,
    BookingStatus,
    BookingType,
    CancelledBy,
    Customer,
    Driver,
    PaymentStatus,
    Rating,
    VerificationStatus,
)
from driver_api.services import pricing_service
from driver_api.services.cancellation_service import CancelParty, calculate_cancellation
from driver_api.services.distance_service import distance_service
from driver_api.services.fare_service import calculate_fare
from driver_api.services.matching_service import matching_service
from driver_api.services.queries import BOOKING_LOAD_OPTIONS, get_booking, log_status
from driver_api.sockets.events import emit
from driver_api.utils.errors import AppError
from driver_api.utils.serializers import serialize_booking

ACTIVE_STATUSES = (BookingStatus.REQUESTED, BookingStatus.SEARCHING,
                   BookingStatus.DRIVER_ASSIGNED, BookingStatus.TRIP_STARTED)
#: Statuses where a driver is committed → cancellation fee applies (4.2)
ON_TRIP_STATUSES = (BookingStatus.DRIVER_ASSIGNED, BookingStatus.TRIP_STARTED)


def _now() -> datetime:
    return datetime.now(timezone.utc)


# --------------------------------------------------------------------------
# Create / estimate
# --------------------------------------------------------------------------

async def create_booking(db: AsyncSession, customer: Customer, data) -> dict:
    """`data` is schemas.CreateBookingIn. Returns the serialized booking plus
    a dues warning flag when pending fees exist (spec 4.5)."""
    pricing = await pricing_service.get_pricing(db)

    dues = customer.pending_dues or 0
    if pricing.block_booking_if_dues_exceed and dues > 0:
        raise AppError.forbidden(
            f"Clear pending dues (₹{dues}) before creating a new booking."
        )

    trip_distance_km = None
    if data.type is BookingType.LOCATION:
        trip_distance_km = await distance_service.distance_km(
            data.pickup_lat, data.pickup_lng, data.drop_lat, data.drop_lng
        )

    # Pickup charge is only known once a driver is assigned — creation returns
    # the base-fare estimate; accept_booking() finalizes total_fare (4.1).
    fare = calculate_fare(
        per_km_rate=pricing.per_km_rate,
        per_hour_rate=pricing.per_hour_rate,
        pickup_free_km_limit=pricing.pickup_free_km_limit,
        pickup_charge_per_km=pricing.pickup_charge_per_km,
        booking_type=data.type,
        trip_distance_km=trip_distance_km,
        hours=data.hours,
        pickup_distance_km=None,
    )

    booking = Booking(
        customer_id=customer.id,
        type=data.type,
        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,
        pickup_address_text=data.pickup_address_text,
        drop_lat=data.drop_lat,
        drop_lng=data.drop_lng,
        drop_address_text=data.drop_address_text,
        hours=data.hours,
        trip_distance_km=trip_distance_km,
        base_fare=fare.base_fare,
        pickup_charge=0,
        total_fare=fare.total_fare,
        status=BookingStatus.REQUESTED,
    )
    db.add(booking)
    await db.flush()
    db.add(log_status(booking.id, BookingStatus.REQUESTED, "Booking created"))
    await db.commit()

    # Re-fetch with the eager options the serializer needs — a freshly built
    # object would trigger sync lazy loads post-commit (illegal under asyncio).
    booking = await get_booking(db, booking.id)

    # Fire the dispatch loop. asyncio is enough for a single instance; for a
    # cluster, hand this off to Celery (the bookings table already carries
    # all the state the loop needs).
    matching_service.start_search(booking.id)

    payload = serialize_booking(booking, viewer="customer", reveal=True)
    response: dict = {"booking": payload, "message": "Booking created. Searching for drivers."}
    if dues > 0:
        response["warning"] = {
            "pending_dues": float(dues),
            "message": "You have unpaid cancellation fees. Clear them to avoid booking restrictions.",
        }
    return response


async def get_fare_estimate(db: AsyncSession, data) -> dict:
    """Pre-booking estimate — no DB write (spec 5). Pickup charge shown as a
    policy explainer since the real value depends on the assigned driver."""
    pricing = await pricing_service.get_pricing(db)

    trip_distance_km = hours = None
    if data.type is BookingType.LOCATION:
        trip_distance_km = await distance_service.distance_km(
            data.pickup_lat, data.pickup_lng, data.drop_lat, data.drop_lng
        )
    else:
        hours = data.hours

    fare = calculate_fare(
        per_km_rate=pricing.per_km_rate,
        per_hour_rate=pricing.per_hour_rate,
        pickup_free_km_limit=pricing.pickup_free_km_limit,
        pickup_charge_per_km=pricing.pickup_charge_per_km,
        booking_type=data.type,
        trip_distance_km=trip_distance_km,
        hours=hours,
        pickup_distance_km=None,
    )
    return {
        "type": data.type.value,
        "trip_distance_km": trip_distance_km,
        "hours": hours,
        "base_fare": float(fare.base_fare),
        "estimated_total_fare": float(fare.total_fare),
        "pickup_charge": {
            "free_km_limit": float(pricing.pickup_free_km_limit),
            "per_km_beyond_limit": float(pricing.pickup_charge_per_km),
            "note": "Added after a driver is assigned, only for the distance beyond the free limit.",
        },
    }


# --------------------------------------------------------------------------
# Customer actions
# --------------------------------------------------------------------------

async def cancel_booking(db: AsyncSession, booking: Booking, *,
                         cancelled_by: CancelParty) -> dict:
    """Shared by customer cancel + driver reject-after-assignment (spec 4.2)."""
    if booking.status not in ACTIVE_STATUSES:
        raise AppError.conflict(
            f"Booking is already {booking.status.value} and cannot be cancelled."
        )

    pricing = await pricing_service.get_pricing(db)
    outcome = calculate_cancellation(
        status=booking.status.value,
        cancelled_by=cancelled_by.value,
        total_fare=booking.total_fare,
        cancellation_fee_percent=pricing.cancellation_fee_percent,
    )

    was_on_trip = booking.status in ON_TRIP_STATUSES
    booking.status = BookingStatus.CANCELLED
    booking.cancelled_by = cancelled_by
    booking.cancelled_at = _now()
    booking.cancellation_fee = outcome.fee
    db.add(log_status(
        booking.id, BookingStatus.CANCELLED,
        f"Cancelled by {cancelled_by.value}"
        + (f"; fee ₹{outcome.fee} added to dues" if outcome.fee_applied else ""),
    ))

    customer_user_id = booking.customer.user_id
    driver_user_id = booking.driver.user_id if booking.driver else None

    if outcome.fee_applied:
        booking.customer.pending_dues = (booking.customer.pending_dues or 0) + outcome.fee
    if outcome.counts_against_driver and booking.driver is not None:
        booking.driver.cancellation_count += 1  # reliability tracking (4.2)

    if not was_on_trip:
        matching_service.stop_search(booking.id)  # still matching → stop the loop
    await db.commit()

    # Notify the other side
    if cancelled_by is CancelParty.CUSTOMER and was_on_trip and driver_user_id:
        await emit(driver_user_id, "booking:cancelled", {
            "booking_id": str(booking.id), "cancelled_by": cancelled_by.value,
        })
    elif cancelled_by is CancelParty.DRIVER:
        await emit(customer_user_id, "booking:cancelled", {
            "booking_id": str(booking.id),
            "cancelled_by": cancelled_by.value,
            "message": "Your driver cancelled the booking. Please create a new one.",
        })

    return {
        "booking": serialize_booking(booking, viewer="customer", reveal=True),
        "cancellation_fee": float(outcome.fee),
        "fee_applied": outcome.fee_applied,
        "message": "Booking cancelled." + (
            f" A cancellation fee of ₹{outcome.fee} was added to your dues."
            if outcome.fee_applied else ""
        ),
    }


async def rate_booking(db: AsyncSession, customer: Customer, booking_id: uuid.UUID,
                       rating: int, review_text: str | None) -> dict:
    booking = await get_booking(db, booking_id)
    if booking is None or booking.customer_id != customer.id:
        raise AppError.not_found("Booking not found")
    if booking.status is not BookingStatus.COMPLETED:
        raise AppError.conflict("Only completed trips can be rated")
    if booking.rating is not None:
        raise AppError.conflict("Booking already rated")

    db.add(Rating(booking_id=booking.id, rating=rating, review_text=review_text))

    if booking.driver is not None:
        # Incremental average over the trips completed so far
        prior_trips = max(booking.driver.total_trips - 1, 0)
        if prior_trips == 0:
            new_avg = Decimal(rating)
        else:
            new_avg = (booking.driver.rating_avg * prior_trips + rating) / (prior_trips + 1)
        booking.driver.rating_avg = new_avg.quantize(Decimal("0.01"))
        await emit(booking.driver.user_id, "booking:rated", {
            "booking_id": str(booking.id), "rating": rating,
        })

    await db.commit()
    booking = await get_booking(db, booking_id)
    return {"booking": serialize_booking(booking, viewer="customer", reveal=True),
            "message": "Thanks for your feedback!"}


# --------------------------------------------------------------------------
# Driver actions
# --------------------------------------------------------------------------

async def accept_booking(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> dict:
    if not (driver.is_verified and driver.verification_status is VerificationStatus.APPROVED):
        raise AppError.forbidden("Your account is not verified yet.")

    booking = await get_booking(db, booking_id)
    if booking is None:
        raise AppError.not_found("Booking not found")
    if booking.driver_id == driver.id and booking.status is BookingStatus.DRIVER_ASSIGNED:
        return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
                "message": "Already assigned to you."}
    if booking.status not in (BookingStatus.REQUESTED, BookingStatus.SEARCHING):
        raise AppError.conflict("This booking is no longer available.")

    # Distance from the driver's current position → pickup charge (4.1)
    pickup_distance_km = 0.0
    if driver.current_lat is not None and driver.current_lng is not None:
        result = await distance_service.get(
            driver.current_lat, driver.current_lng, booking.pickup_lat, booking.pickup_lng
        )
        pickup_distance_km = result.distance_km

    pricing = await pricing_service.get_pricing(db)
    fare = calculate_fare(
        per_km_rate=pricing.per_km_rate,
        per_hour_rate=pricing.per_hour_rate,
        pickup_free_km_limit=pricing.pickup_free_km_limit,
        pickup_charge_per_km=pricing.pickup_charge_per_km,
        booking_type=booking.type,
        trip_distance_km=booking.trip_distance_km,
        hours=booking.hours,
        pickup_distance_km=pickup_distance_km,
    )

    # Race-safe assignment: single conditional UPDATE. PostgreSQL row-locks
    # the booking row, so of N concurrent accepts exactly one wins (spec 6).
    result = await db.execute(
        update(Booking)
        .where(
            Booking.id == booking_id,
            Booking.driver_id.is_(None),
            Booking.status.in_([BookingStatus.REQUESTED, BookingStatus.SEARCHING]),
        )
        .values(
            driver_id=driver.id,
            status=BookingStatus.DRIVER_ASSIGNED,
            assigned_at=func.now(),
            phone_revealed=True,  # phones unlock exactly at assignment (4.4)
            pickup_distance_km=pickup_distance_km,
            base_fare=fare.base_fare,
            pickup_charge=fare.pickup_charge,
            total_fare=fare.total_fare,
        )
        .execution_options(synchronize_session=False)
    )
    if result.rowcount == 0:
        raise AppError.conflict("Booking already assigned to another driver.")

    db.add(log_status(booking_id, BookingStatus.DRIVER_ASSIGNED,
                      f"Accepted by driver {driver.user.name or driver.user.phone}"))
    matching_service.stop_search(booking_id)
    await db.commit()

    booking = await get_booking(db, booking_id)
    await emit(booking.customer.user_id, "booking:accepted", {
        "booking": serialize_booking(booking, viewer="customer", reveal=True),
        "driver": {
            "driver_id": str(driver.id),
            "name": driver.user.name,
            "phone": driver.user.phone,
            "rating_avg": float(driver.rating_avg or 0),
            "total_trips": driver.total_trips,
            "pickup_distance_km": pickup_distance_km,
        },
    })
    return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
            "message": "Booking accepted."}


async def reject_booking(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> dict:
    booking = await get_booking(db, booking_id)
    if booking is None:
        raise AppError.not_found("Booking not found")

    if booking.driver_id == driver.id:
        # Assigned driver backing out → driver cancellation (no fee to
        # customer; counts toward driver reliability, spec 4.2)
        return await cancel_booking(db, booking, cancelled_by=CancelParty.DRIVER)

    if booking.status in (BookingStatus.REQUESTED, BookingStatus.SEARCHING):
        matching_service.opt_out(booking.id, driver.user_id)
        return {"message": "Request rejected."}

    raise AppError.conflict("This booking cannot be rejected.")


async def start_trip(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> dict:
    booking = await _assigned_booking(db, driver, booking_id)
    if booking.status is not BookingStatus.DRIVER_ASSIGNED:
        raise AppError.conflict(f"Cannot start a trip from status '{booking.status.value}'.")

    booking.status = BookingStatus.TRIP_STARTED
    booking.started_at = _now()
    db.add(log_status(booking.id, BookingStatus.TRIP_STARTED, "Trip started"))
    await db.commit()

    await emit(booking.customer.user_id, "booking:status_update", {
        "booking_id": str(booking.id), "status": booking.status.value,
        "started_at": booking.started_at.isoformat(),
    })
    return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
            "message": "Trip started."}


async def complete_trip(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> dict:
    booking = await _assigned_booking(db, driver, booking_id)
    if booking.status is not BookingStatus.TRIP_STARTED:
        raise AppError.conflict(f"Cannot complete a trip from status '{booking.status.value}'.")

    booking.status = BookingStatus.COMPLETED
    booking.completed_at = _now()
    driver.total_trips += 1
    db.add(log_status(booking.id, BookingStatus.COMPLETED, "Trip completed"))
    await db.commit()

    await emit(booking.customer.user_id, "booking:status_update", {
        "booking_id": str(booking.id),
        "status": booking.status.value,
        "completed_at": booking.completed_at.isoformat(),
        "total_fare": float(booking.total_fare),
        "payment_status": booking.payment_status.value,
        "note": "Pay the driver directly (cash/UPI).",
    })
    return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
            "message": "Trip completed. Collect payment to finish."}


async def mark_payment_collected(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> dict:
    booking = await _assigned_booking(db, driver, booking_id)
    if booking.status is not BookingStatus.COMPLETED:
        raise AppError.conflict("Payment can be marked only after trip completion.")
    if booking.payment_status is PaymentStatus.COLLECTED:
        return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
                "message": "Payment already marked as collected."}

    booking.payment_status = PaymentStatus.COLLECTED
    await db.commit()

    await emit(booking.customer.user_id, "booking:status_update", {
        "booking_id": str(booking.id),
        "status": booking.status.value,
        "payment_status": booking.payment_status.value,
    })
    return {"booking": serialize_booking(booking, viewer="driver", reveal=True),
            "message": "Payment marked as collected."}


# --------------------------------------------------------------------------
# Reads
# --------------------------------------------------------------------------

async def get_booking_detail(db: AsyncSession, booking_id: uuid.UUID,
                             *, viewer_role: str, customer: Customer | None = None,
                             driver: Driver | None = None) -> dict:
    booking = await get_booking(db, booking_id)
    if booking is None:
        raise AppError.not_found("Booking not found")

    if viewer_role == "customer":
        if customer is None or booking.customer_id != customer.id:
            raise AppError.forbidden("Not your booking")
        payload = serialize_booking(booking, viewer="customer", reveal=True)
        payload["status_log"] = [
            {"status": s.status.value, "note": s.note,
             "changed_at": s.changed_at.isoformat() if s.changed_at else None}
            for s in booking.status_log
        ]
        return payload
    if viewer_role == "driver":
        if driver is None or booking.driver_id != driver.id:
            raise AppError.forbidden("Not your booking")
        return serialize_booking(booking, viewer="driver", reveal=True)
    return serialize_booking(booking, viewer="admin", reveal=True)


async def list_customer_bookings(db: AsyncSession, customer: Customer,
                                 status: BookingStatus | None = None) -> list[dict]:
    stmt = (select(Booking).where(Booking.customer_id == customer.id)
            .options(*BOOKING_LOAD_OPTIONS)
            .order_by(Booking.requested_at.desc()))
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return [serialize_booking(b, viewer="customer", reveal=True) for b in rows]


async def list_driver_bookings(db: AsyncSession, driver: Driver,
                               status: BookingStatus | None = None) -> list[dict]:
    stmt = (select(Booking).where(Booking.driver_id == driver.id)
            .options(*BOOKING_LOAD_OPTIONS)
            .order_by(Booking.requested_at.desc()))
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return [serialize_booking(b, viewer="driver", reveal=True) for b in rows]


async def driver_earnings(db: AsyncSession, driver: Driver) -> dict:
    rows = (await db.execute(
        select(Booking.total_fare, Booking.payment_status)
        .where(Booking.driver_id == driver.id,
               Booking.status == BookingStatus.COMPLETED)
    )).all()
    total = sum((fare for fare, _ in rows), start=Decimal("0"))
    collected = sum(
        (fare for fare, paid in rows if paid is PaymentStatus.COLLECTED),
        start=Decimal("0"),
    )
    return {
        "total_earnings": float(total),
        "collected": float(collected),
        "pending_payment": float(total - collected),
        "total_trips": driver.total_trips,
        "completed_bookings": len(rows),
    }


# --------------------------------------------------------------------------
# Internals
# --------------------------------------------------------------------------

async def _assigned_booking(db: AsyncSession, driver: Driver, booking_id: uuid.UUID) -> Booking:
    booking = await get_booking(db, booking_id)
    if booking is None:
        raise AppError.not_found("Booking not found")
    if booking.driver_id != driver.id:
        raise AppError.forbidden("You are not the assigned driver on this booking.")
    return booking
