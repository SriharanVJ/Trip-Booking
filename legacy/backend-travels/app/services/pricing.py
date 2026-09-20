"""Price calculation service for vehicle bookings"""

from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from enum import Enum

class TripType(str, Enum):
    """Trip types"""
    ONE_WAY = "ONE_WAY"
    ROUND_TRIP = "ROUND_TRIP"
    MULTI_CITY = "MULTI_CITY"


class PricingService:
    """Service for calculating booking prices"""

    # Default pricing configuration
    DEFAULT_SERVICE_TAX_RATE = Decimal("0.18")  # 18% GST
    DEFAULT_TOLL_CHARGE_PER_KM = Decimal("0.50")
    DEFAULT_PARKING_CHARGE_PER_DAY = Decimal("200")
    DEFAULT_NIGHT_HALT_CHARGE = Decimal("500")
    MIN_ROUND_TRIP_DISCOUNT = Decimal("0.10")  # 10% discount for round trips
    MAX_ROUND_TRIP_DISCOUNT = Decimal("0.20")  # 20% max discount
    ADVANCE_PAYMENT_PERCENTAGE = Decimal("0.25")  # 25% advance required

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize pricing service with optional configuration"""
        self.config = config or {}
        self.service_tax_rate = Decimal(str(
            self.config.get("service_tax_rate", self.DEFAULT_SERVICE_TAX_RATE)
        ))
        self.toll_charge_per_km = Decimal(str(
            self.config.get("toll_charge_per_km", self.DEFAULT_TOLL_CHARGE_PER_KM)
        ))
        self.parking_charge_per_day = Decimal(str(
            self.config.get("parking_charge_per_day", self.DEFAULT_PARKING_CHARGE_PER_DAY)
        ))
        self.night_halt_charge = Decimal(str(
            self.config.get("night_halt_charge", self.DEFAULT_NIGHT_HALT_CHARGE)
        ))

    async def calculate_price(
        self,
        vehicle_data: Dict[str, Any],
        trip_type: str,
        distance_km: Decimal,
        duration_hours: Optional[Decimal] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        multi_city_stops: Optional[List[Dict]] = None,
        include_toll: bool = True,
        include_parking: bool = False,
        promo_discount: Optional[Decimal] = None,
        promo_code: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculate total price for a booking

        Args:
            vehicle_data: Vehicle pricing information
            trip_type: Type of trip (ONE_WAY, ROUND_TRIP, MULTI_CITY)
            distance_km: Total distance in kilometers
            duration_hours: Estimated duration in hours
            start_date: Trip start date
            end_date: Trip end date
            multi_city_stops: List of stops for multi-city trips
            include_toll: Whether to include toll charges
            include_parking: Whether to include parking charges
            promo_discount: Discount amount from promo code
            promo_code: Promo code applied

        Returns:
            Dictionary with complete price breakdown
        """
        # Extract vehicle pricing
        price_per_km = Decimal(str(vehicle_data.get("price_per_km", 0)))
        minimum_charge = Decimal(str(vehicle_data.get("minimum_charge", 0)))
        driver_allowance_per_day = Decimal(str(vehicle_data.get("driver_allowance_per_day", 0)))
        minimum_days = int(vehicle_data.get("minimum_days", 1))

        # Calculate trip duration in days
        trip_days = self._calculate_trip_days(start_date, end_date, duration_hours)
        applicable_days = max(trip_days, minimum_days)

        # Calculate base fare (distance × per km rate)
        distance_charge = self._calculate_distance_charge(
            distance_km, price_per_km, trip_type
        )

        # Apply minimum charge guarantee
        base_fare = max(distance_charge, minimum_charge)

        # Calculate driver allowance
        driver_allowance = driver_allowance_per_day * applicable_days

        # Calculate additional charges
        toll_charges = self._calculate_toll_charges(distance_km, include_toll)
        parking_charges = self._calculate_parking_charges(applicable_days, include_parking)
        night_halt_charges = self._calculate_night_halt_charges(trip_days, duration_hours)

        # Calculate round-trip discount
        round_trip_discount = self._calculate_round_trip_discount(
            base_fare, trip_type
        )

        # Calculate subtotal
        subtotal = (
            base_fare +
            driver_allowance +
            toll_charges +
            parking_charges +
            night_halt_charges -
            round_trip_discount
        )

        # Calculate service tax
        service_tax = (subtotal * self.service_tax_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # Apply promo discount
        discount = Decimal("0")
        discount_applied = None
        if promo_discount:
            discount = min(promo_discount, subtotal * Decimal("0.50"))  # Max 50% discount
            discount_applied = promo_code

        # Calculate total
        total_amount = subtotal + service_tax - discount

        # Calculate advance and balance
        advance_required = (total_amount * self.ADVANCE_PAYMENT_PERCENTAGE).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        balance_payable = total_amount - advance_required

        # Build price breakdown
        breakdown = {
            "distance_km": float(distance_km),
            "trip_days": applicable_days,
            "base_rate_per_km": float(price_per_km),
            "minimum_charge_applied": float(distance_charge < minimum_charge),
            "driver_allowance_per_day": float(driver_allowance_per_day),
            "round_trip_discount_applied": float(round_trip_discount) > 0,
        }

        return {
            "base_fare": base_fare,
            "distance_charge": distance_charge,
            "driver_allowance": driver_allowance,
            "toll_charges": toll_charges,
            "parking_charges": parking_charges,
            "night_halt_charges": night_halt_charges,
            "round_trip_discount": round_trip_discount,
            "subtotal": subtotal,
            "service_tax": service_tax,
            "service_tax_rate": self.service_tax_rate,
            "discount": discount,
            "discount_applied": discount_applied,
            "total_amount": total_amount,
            "minimum_guarantee": minimum_charge,
            "advance_required": advance_required,
            "balance_payable": balance_payable,
            "breakdown": breakdown
        }

    def _calculate_distance_charge(
        self,
        distance_km: Decimal,
        price_per_km: Decimal,
        trip_type: str
    ) -> Decimal:
        """Calculate distance charge based on trip type"""
        if trip_type == TripType.ROUND_TRIP:
            # Round trip uses double distance
            distance = distance_km * 2
        elif trip_type == TripType.MULTI_CITY:
            # Multi-city uses distance as-is (sum of all segments)
            distance = distance_km
        else:
            # One-way uses direct distance
            distance = distance_km

        charge = distance * price_per_km
        return charge.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _calculate_trip_days(
        self,
        start_date: Optional[datetime],
        end_date: Optional[datetime],
        duration_hours: Optional[Decimal]
    ) -> int:
        """Calculate number of days for the trip"""
        if start_date and end_date:
            delta = end_date - start_date
            days = delta.days + (1 if delta.seconds > 0 else 0)
            return max(days, 1)

        if duration_hours:
            days = int(duration_hours) / 24
            return max(int(days) + (1 if days % 24 > 0 else 0), 1)

        return 1  # Default to 1 day

    def _calculate_toll_charges(
        self,
        distance_km: Decimal,
        include_toll: bool
    ) -> Decimal:
        """Calculate toll charges"""
        if not include_toll:
            return Decimal("0")

        charge = distance_km * self.toll_charge_per_km
        return charge.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _calculate_parking_charges(
        self,
        days: int,
        include_parking: bool
    ) -> Decimal:
        """Calculate parking charges"""
        if not include_parking:
            return Decimal("0")

        charge = Decimal(days) * self.parking_charge_per_day
        return charge.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _calculate_night_halt_charges(
        self,
        days: int,
        duration_hours: Optional[Decimal] = None
    ) -> Decimal:
        """Calculate night halt charges for multi-day trips"""
        # Night halt charges apply for trips beyond 1 day
        if days <= 1:
            return Decimal("0")

        # Number of nights = days - 1
        nights = days - 1
        charge = Decimal(nights) * self.night_halt_charge
        return charge.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _calculate_round_trip_discount(
        self,
        base_fare: Decimal,
        trip_type: str
    ) -> Decimal:
        """Calculate round-trip discount"""
        if trip_type != TripType.ROUND_TRIP:
            return Decimal("0")

        # Apply 10-20% discount for round trips
        discount_rate = self.MIN_ROUND_TRIP_DISCOUNT
        discount = base_fare * discount_rate
        return discount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    async def calculate_multi_city_price(
        self,
        vehicle_data: Dict[str, Any],
        stops: List[Dict[str, Any]],
        start_date: datetime,
        include_toll: bool = True,
        promo_discount: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Calculate price for multi-city trip

        Args:
            vehicle_data: Vehicle pricing information
            stops: List of stops with distances
            start_date: Trip start date
            include_toll: Whether to include toll charges
            promo_discount: Discount from promo code

        Returns:
            Price breakdown for multi-city trip
        """
        # Calculate total distance from all stops
        total_distance = Decimal("0")
        for i, stop in enumerate(stops):
            if "distance_from_previous" in stop:
                total_distance += Decimal(str(stop["distance_from_previous"]))
            elif "distance_km" in stop:
                total_distance += Decimal(str(stop["distance_km"]))

        # Calculate duration from stops
        total_duration = None
        if "estimated_duration_hours" in vehicle_data:
            total_duration = Decimal(str(vehicle_data["estimated_duration_hours"]))

        # Calculate end date from last stop
        end_date = None
        if stops and "estimated_arrival" in stops[-1]:
            end_date = stops[-1]["estimated_arrival"]

        # Use standard calculation with multi-city type
        return await self.calculate_price(
            vehicle_data=vehicle_data,
            trip_type=TripType.MULTI_CITY,
            distance_km=total_distance,
            duration_hours=total_duration,
            start_date=start_date,
            end_date=end_date,
            multi_city_stops=stops,
            include_toll=include_toll,
            promo_discount=promo_discount
        )

    def validate_minimum_charge(
        self,
        calculated_amount: Decimal,
        vehicle_minimum_charge: Decimal
    ) -> Decimal:
        """Ensure calculated amount meets minimum charge requirement"""
        return max(calculated_amount, vehicle_minimum_charge)

    def calculate_cancellation_refund(
        self,
        total_amount: Decimal,
        cancellation_hours_before_trip: int,
        refund_policy: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate refund amount for cancellation

        Args:
            total_amount: Total booking amount
            cancellation_hours_before_trip: Hours before trip when cancelled
            refund_policy: Optional custom refund policy

        Returns:
            Refund calculation details
        """
        # Default refund policy
        policy = refund_policy or {
            "full_refund_hours": 48,  # Full refund if cancelled 48+ hours before
            "partial_refund_hours": 24,  # 50% refund if cancelled 24-48 hours before
            "partial_refund_percent": 50,
            "no_refund_hours": 0  # No refund if cancelled less than 24 hours before
        }

        full_refund_hours = policy.get("full_refund_hours", 48)
        partial_refund_hours = policy.get("partial_refund_hours", 24)
        partial_refund_percent = Decimal(str(policy.get("partial_refund_percent", 50)))

        if cancellation_hours_before_trip >= full_refund_hours:
            refund_percent = Decimal("100")
        elif cancellation_hours_before_trip >= partial_refund_hours:
            refund_percent = partial_refund_percent
        else:
            refund_percent = Decimal("0")

        refund_amount = (total_amount * refund_percent / Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        return {
            "refund_amount": refund_amount,
            "refund_percent": refund_percent,
            "cancellation_charge": total_amount - refund_amount,
            "policy_applied": "full" if refund_percent == 100 else "partial" if refund_percent > 0 else "none"
        }


# Singleton instance
pricing_service = PricingService()
