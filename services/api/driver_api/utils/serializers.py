"""Serialization of ORM objects into JSON-safe dicts for REST + WS payloads.

Privacy rule (spec 4.4): before a booking reaches `driver_assigned`, any
driver-facing payload carries only ~1km-coarsened pickup coordinates and
no customer name/phone/drop address. `reveal=True` (set at assignment)
unlocks the full payload.
"""

from __future__ import annotations

import uuid
from decimal import Decimal

from driver_api.models import Booking
from driver_api.utils.geo import coarsen_to_km


def _dt(value):
    return value.isoformat() if value else None


def _money(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def driver_brief(driver, *, include_contact: bool) -> dict | None:
    if driver is None:
        return None
    data = {
        "driver_id": str(driver.id),
        "name": driver.user.name,
        "rating_avg": _money(driver.rating_avg),
        "total_trips": driver.total_trips,
    }
    if include_contact:  # driver's own contact → customer, after assignment
        data["phone"] = driver.user.phone
    return data


def serialize_booking(booking: Booking, *, viewer: str, reveal: bool) -> dict:
    """viewer: 'customer' | 'driver' | 'admin'.

    reveal gates driver-side sensitive fields; customer/admin payloads are
    always full for their own booking.
    """
    fares = {
        "base_fare": _money(booking.base_fare),
        "pickup_charge": _money(booking.pickup_charge),
        "total_fare": _money(booking.total_fare),
        "cancellation_fee": _money(booking.cancellation_fee),
    }

    if viewer == "driver" and not reveal:
        # Pre-assignment offer — coarse area only, no drop, no customer identity
        return {
            "id": str(booking.id),
            "type": booking.type.value,
            "status": booking.status.value,
            "pickup": {
                "lat": coarsen_to_km(booking.pickup_lat),
                "lng": coarsen_to_km(booking.pickup_lng),
                "address_text": None,
                "approximate": True,
            },
            "drop": None,
            "hours": booking.hours,
            "trip_distance_km": booking.trip_distance_km,
            "fares": {"total_fare": fares["total_fare"]},  # pickup charge not yet known
            "requested_at": _dt(booking.requested_at),
        }

    is_driver_view = viewer == "driver"
    data = {
        "id": str(booking.id),
        "customer_id": str(booking.customer_id),
        "driver_id": str(booking.driver_id) if booking.driver_id else None,
        "type": booking.type.value,
        "status": booking.status.value,
        "pickup": {
            "lat": booking.pickup_lat,
            "lng": booking.pickup_lng,
            "address_text": booking.pickup_address_text,
        },
        "drop": (
            {"lat": booking.drop_lat, "lng": booking.drop_lng,
             "address_text": booking.drop_address_text}
            if booking.drop_lat is not None or booking.drop_address_text
            else None
        ),
        "hours": booking.hours,
        "trip_distance_km": booking.trip_distance_km,
        "pickup_distance_km": booking.pickup_distance_km,
        "fares": fares,
        "payment_status": booking.payment_status.value,
        "cancelled_by": booking.cancelled_by.value if booking.cancelled_by else None,
        "phone_revealed": booking.phone_revealed,
        "requested_at": _dt(booking.requested_at),
        "assigned_at": _dt(booking.assigned_at),
        "started_at": _dt(booking.started_at),
        "completed_at": _dt(booking.completed_at),
        "cancelled_at": _dt(booking.cancelled_at),
    }

    if not is_driver_view:  # customer/admin always see who took the job
        data["driver"] = driver_brief(booking.driver, include_contact=True)
        if booking.rating:
            data["rating"] = {
                "rating": booking.rating.rating,
                "review_text": booking.rating.review_text,
            }
    else:
        data["customer"] = {
            "name": booking.customer.user.name,
            "phone": booking.customer.user.phone,
        }

    return data


def serialize_status_log(booking: Booking) -> list[dict]:
    return [
        {"status": entry.status.value, "note": entry.note, "changed_at": _dt(entry.changed_at)}
        for entry in booking.status_log
    ]


def booking_oid(value: str | uuid.UUID) -> uuid.UUID:
    return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
