"""Cancellation fee rules — pure, side-effect-free (spec 4.2).

Fee (cancellation_fee_percent of total_fare) applies ONLY when:
  booking.status in {driver_assigned, trip_started} AND cancelled_by == customer
Otherwise the fee is 0:
  - cancelled while requested/searching → no fee
  - driver cancelled → no fee to customer; caller bumps
    drivers.cancellation_count for reliability tracking (no fee logic yet)
"""

from __future__ import annotations

import enum
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from driver_api.services.fare_service import round2


class CancelParty(str, enum.Enum):
    """Decoupled from the ORM enum so tests need no DB imports."""

    CUSTOMER = "customer"
    DRIVER = "driver"


class CancellableStatus(str, enum.Enum):
    REQUESTED = "requested"
    SEARCHING = "searching"
    DRIVER_ASSIGNED = "driver_assigned"
    TRIP_STARTED = "trip_started"


#: Statuses where a driver is already committed to the trip
FEE_APPLICABLE_STATUSES = frozenset(
    {CancellableStatus.DRIVER_ASSIGNED, CancellableStatus.TRIP_STARTED}
)


@dataclass(frozen=True)
class CancellationOutcome:
    fee: Decimal
    fee_applied: bool
    counts_against_driver: bool


def is_cancellation_fee_applicable(status: str, cancelled_by: str) -> bool:
    return (
        CancelParty(cancelled_by) is CancelParty.CUSTOMER
        and CancellableStatus(status) in FEE_APPLICABLE_STATUSES
    )


def calculate_cancellation_fee(
    total_fare: Decimal, cancellation_fee_percent: Decimal
) -> Decimal:
    return round2(Decimal(str(total_fare)) * cancellation_fee_percent / Decimal("100"))


def calculate_cancellation(
    status: str,
    cancelled_by: str,
    total_fare: Decimal,
    cancellation_fee_percent: Decimal,
) -> CancellationOutcome:
    applicable = is_cancellation_fee_applicable(status, cancelled_by)
    fee = (
        calculate_cancellation_fee(total_fare, cancellation_fee_percent)
        if applicable
        else Decimal("0.00")
    )
    return CancellationOutcome(
        fee=fee,
        fee_applied=applicable,
        counts_against_driver=CancelParty(cancelled_by) is CancelParty.DRIVER,
    )
