"""Cancellation fee rules (spec 4.2): 15% of total_fare ONLY when the
customer cancels after a driver was assigned (driver_assigned / trip_started).
Driver cancellations never charge the customer."""

from decimal import Decimal

import pytest

from driver_api.services.cancellation_service import (
    CancelParty,
    calculate_cancellation,
    calculate_cancellation_fee,
    is_cancellation_fee_applicable,
)

FIFTEEN_PERCENT = Decimal("15")


class TestFeeApplicability:
    def test_customer_cancel_after_assignment_is_charged(self):
        assert is_cancellation_fee_applicable("driver_assigned", "customer") is True
        assert is_cancellation_fee_applicable("trip_started", "customer") is True

    def test_customer_cancel_before_assignment_is_free(self):
        assert is_cancellation_fee_applicable("requested", "customer") is False
        assert is_cancellation_fee_applicable("searching", "customer") is False

    def test_driver_cancel_is_never_charged(self):
        for status in ("requested", "searching", "driver_assigned", "trip_started"):
            assert is_cancellation_fee_applicable(status, "driver") is False


class TestFeeCalculation:
    def test_fifteen_percent_of_total(self):
        fee = calculate_cancellation_fee(Decimal("200.00"), FIFTEEN_PERCENT)
        assert fee == Decimal("30.00")

    def test_fee_rounds_half_up(self):
        # 15% of 137.50 = 20.625 → 20.63
        assert calculate_cancellation_fee(Decimal("137.50"), FIFTEEN_PERCENT) == Decimal("20.63")

    def test_zero_percent_config_charges_nothing(self):
        assert calculate_cancellation_fee(Decimal("999.99"), Decimal("0")) == Decimal("0.00")


class TestCancellationOutcome:
    def test_customer_cancels_assigned_booking(self):
        outcome = calculate_cancellation(
            status="driver_assigned", cancelled_by="customer",
            total_fare=Decimal("200.00"), cancellation_fee_percent=FIFTEEN_PERCENT,
        )
        assert outcome.fee == Decimal("30.00")
        assert outcome.fee_applied is True
        assert outcome.counts_against_driver is False

    def test_customer_cancels_during_trip(self):
        outcome = calculate_cancellation(
            status="trip_started", cancelled_by="customer",
            total_fare=Decimal("500.00"), cancellation_fee_percent=FIFTEEN_PERCENT,
        )
        assert outcome.fee == Decimal("75.00")
        assert outcome.fee_applied is True

    def test_customer_cancels_while_searching_no_fee(self):
        outcome = calculate_cancellation(
            status="searching", cancelled_by="customer",
            total_fare=Decimal("500.00"), cancellation_fee_percent=FIFTEEN_PERCENT,
        )
        assert outcome.fee == Decimal("0.00")
        assert outcome.fee_applied is False

    def test_driver_cancels_assigned_booking_no_fee_but_counted(self):
        outcome = calculate_cancellation(
            status="driver_assigned", cancelled_by="driver",
            total_fare=Decimal("200.00"), cancellation_fee_percent=FIFTEEN_PERCENT,
        )
        assert outcome.fee == Decimal("0.00")
        assert outcome.fee_applied is False
        assert outcome.counts_against_driver is True

    def test_unknown_status_is_rejected(self):
        with pytest.raises(ValueError):
            calculate_cancellation(
                status="completed", cancelled_by="customer",
                total_fare=Decimal("100"), cancellation_fee_percent=FIFTEEN_PERCENT,
            )
