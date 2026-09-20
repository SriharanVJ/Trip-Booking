"""Shared query helpers — avoids import cycles between services."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from driver_api.models import Booking, BookingStatus, BookingStatusLog, Customer, Driver

#: Relationships needed by the booking serializers (customer/driver + their users)
BOOKING_LOAD_OPTIONS = (
    selectinload(Booking.customer).selectinload(Customer.user),
    selectinload(Booking.driver).selectinload(Driver.user),
    selectinload(Booking.rating),
    selectinload(Booking.status_log),
)


async def get_booking(db, booking_id: uuid.UUID) -> Booking | None:
    return (
        await db.execute(
            select(Booking)
            .where(Booking.id == booking_id)
            .options(*BOOKING_LOAD_OPTIONS)
            .execution_options(populate_existing=True)
        )
    ).scalar_one_or_none()


def log_status(booking_id: uuid.UUID, status: BookingStatus, note: str | None = None) -> BookingStatusLog:
    return BookingStatusLog(booking_id=booking_id, status=status, note=note)
