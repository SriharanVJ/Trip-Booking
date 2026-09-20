"""Fare calculation — pure, side-effect-free functions (spec 4.1).

All arithmetic uses Decimal and ROUND_HALF_UP so money behaves like a
cash ledger. (Python's built-in round() is banker's rounding — avoid it
for money.)

Rules:
  location bookings: base_fare = trip_distance_km * per_km_rate
  hourly bookings:   base_fare = hours * per_hour_rate
  pickup_charge      = max(0, pickup_distance_km - pickup_free_km_limit)
                       * pickup_charge_per_km
  total_fare         = base_fare + pickup_charge
"""

from __future__ import annotations

import enum
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

ZERO = Decimal("0")


def round2(value: Decimal | float | int | str) -> Decimal:
    """Quantize money to 2 places, half-up (never use built-in round() here)."""
    return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


class FareBookingType(str, enum.Enum):
    """Decoupled from the ORM enum so tests need no DB imports."""

    LOCATION = "location"
    HOURLY = "hourly"


@dataclass(frozen=True)
class FareBreakdown:
    base_fare: Decimal
    pickup_charge: Decimal
    total_fare: Decimal


def calculate_base_fare(
    booking_type: FareBookingType | str,
    per_km_rate: Decimal,
    per_hour_rate: Decimal,
    trip_distance_km: float | None = None,
    hours: int | None = None,
) -> Decimal:
    btype = FareBookingType(booking_type)
    if btype is FareBookingType.LOCATION:
        if trip_distance_km is None:
            raise ValueError("trip_distance_km is required for location bookings")
        return round2(Decimal(str(trip_distance_km)) * per_km_rate)
    if hours is None:
        raise ValueError("hours is required for hourly bookings")
    return round2(Decimal(hours) * per_hour_rate)


def calculate_pickup_charge(
    pickup_distance_km: float,
    pickup_free_km_limit: Decimal,
    pickup_charge_per_km: Decimal,
) -> Decimal:
    """Free pickup within the limit; ₹/km applies only to the km beyond it."""
    chargeable_km = max(ZERO, Decimal(str(pickup_distance_km)) - pickup_free_km_limit)
    return round2(chargeable_km * pickup_charge_per_km)


def calculate_fare(
    per_km_rate: Decimal,
    per_hour_rate: Decimal,
    pickup_free_km_limit: Decimal,
    pickup_charge_per_km: Decimal,
    booking_type: FareBookingType | str,
    trip_distance_km: float | None = None,
    hours: int | None = None,
    pickup_distance_km: float | None = None,
) -> FareBreakdown:
    """Full breakdown per spec 4.1.

    pickup_distance_km is only known once a driver is assigned; pass None
    before assignment (pickup_charge = 0, filled in at accept time).
    """
    base_fare = calculate_base_fare(
        booking_type, per_km_rate, per_hour_rate,
        trip_distance_km=trip_distance_km, hours=hours,
    )
    pickup_charge = (
        calculate_pickup_charge(pickup_distance_km, pickup_free_km_limit, pickup_charge_per_km)
        if pickup_distance_km is not None
        else ZERO
    )
    return FareBreakdown(
        base_fare=base_fare,
        pickup_charge=round2(pickup_charge),
        total_fare=round2(base_fare + pickup_charge),
    )
