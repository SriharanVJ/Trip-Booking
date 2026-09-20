"""Fare rules (spec 4.1): free pickup ≤ 3 km, ₹15/km beyond, base fare by
distance (location) or hours (hourly). Defaults: ₹15/km, ₹150/hour."""

from decimal import Decimal

import pytest

from driver_api.services.fare_service import (
    FareBookingType,
    calculate_base_fare,
    calculate_fare,
    calculate_pickup_charge,
    round2,
)

# pricing_config seed defaults
PER_KM = Decimal("15")
PER_HOUR = Decimal("150")
FREE_KM = Decimal("3")
PICKUP_PER_KM = Decimal("15")


def fare(**kwargs):
    return calculate_fare(
        per_km_rate=PER_KM,
        per_hour_rate=PER_HOUR,
        pickup_free_km_limit=FREE_KM,
        pickup_charge_per_km=PICKUP_PER_KM,
        **kwargs,
    )


class TestBaseFare:
    def test_location_base_fare(self):
        assert fare(booking_type="location", trip_distance_km=10).base_fare == Decimal("150.00")

    def test_hourly_base_fare(self):
        assert fare(booking_type="hourly", hours=3).base_fare == Decimal("450.00")

    def test_zero_distance_location(self):
        assert fare(booking_type="location", trip_distance_km=0).base_fare == Decimal("0.00")

    def test_fractional_distance_rounds_half_up(self):
        # 0.067 km × ₹15 = ₹1.005 → ₹1.01 (banker's rounding would say ₹1.00)
        assert fare(booking_type="location", trip_distance_km=0.067).base_fare == Decimal("1.01")

    def test_location_requires_distance(self):
        with pytest.raises(ValueError):
            calculate_base_fare("location", PER_KM, PER_HOUR, trip_distance_km=None)

    def test_hourly_requires_hours(self):
        with pytest.raises(ValueError):
            calculate_base_fare("hourly", PER_KM, PER_HOUR, hours=None)


class TestPickupCharge:
    def test_within_free_limit_is_free(self):
        assert calculate_pickup_charge(2.5, FREE_KM, PICKUP_PER_KM) == Decimal("0.00")

    def test_exactly_at_free_limit_is_free(self):
        assert calculate_pickup_charge(3.0, FREE_KM, PICKUP_PER_KM) == Decimal("0.00")

    def test_beyond_free_limit_charges_only_excess(self):
        # (8.5 − 3) km × ₹15 = ₹82.50
        assert calculate_pickup_charge(8.5, FREE_KM, PICKUP_PER_KM) == Decimal("82.50")

    def test_zero_pickup_distance(self):
        assert calculate_pickup_charge(0, FREE_KM, PICKUP_PER_KM) == Decimal("0.00")

    def test_very_large_distance(self):
        # (500.555 − 3) × 15 = 7463.325 → half-up → 7463.33
        assert calculate_pickup_charge(500.555, FREE_KM, PICKUP_PER_KM) == Decimal("7463.33")

    def test_rounding_helper_is_half_up(self):
        assert round2(Decimal("1.005")) == Decimal("1.01")
        assert round2(Decimal("2.675")) == Decimal("2.68")


class TestFullBreakdown:
    def test_total_is_base_plus_pickup(self):
        result = fare(booking_type="location", trip_distance_km=12, pickup_distance_km=8.5)
        assert result.base_fare == Decimal("180.00")
        assert result.pickup_charge == Decimal("82.50")
        assert result.total_fare == Decimal("262.50")

    def test_no_pickup_distance_yet_means_zero_pickup_charge(self):
        """Pre-assignment, the pickup distance is unknown — charge 0 for now."""
        result = fare(booking_type="hourly", hours=2)
        assert result.pickup_charge == Decimal("0.00")
        assert result.total_fare == result.base_fare == Decimal("300.00")

    def test_long_trip_with_free_pickup(self):
        result = fare(booking_type="location", trip_distance_km=25, pickup_distance_km=2)
        assert result.total_fare == Decimal("375.00")  # 25×15, pickup free
