"""Booking endpoints for the vehicle booking API"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4
import random


def make_naive(dt: datetime) -> datetime:
    """Convert timezone-aware datetime to naive datetime by removing timezone info"""
    if dt.tzinfo is not None:
        return dt.replace(tzinfo=None)
    return dt

from app.db.session import get_db
from app.db.crud import (
    create_booking,
    get_bookings,
    get_booking_by_id,
    get_booking_by_number,
    update_booking_status,
    cancel_booking as cancel_booking_crud,
    get_vehicle_by_id,
    get_customer_by_id
)
from app.db.models import BookingStatus
from app.services.pricing import pricing_service
from app.schemas.vehicle import (
    BookingCreate,
    BookingResponse,
    BookingDetailResponse,
    BookingUpdate,
    BookingStatusUpdate,
    PriceEstimateRequest,
    PriceEstimateResponse,
    ErrorResponse,
    SuccessResponse
)

router = APIRouter()


def generate_booking_number() -> str:
    """Generate a unique booking number"""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    random_suffix = random.randint(1000, 9999)
    return f"BK{timestamp}{random_suffix}"


@router.post(
    "",
    response_model=dict,
    status_code=status.HTTP_201_CREATED,
    summary="Create new booking",
    description="Create a new vehicle booking with pricing calculation"
)
async def create_booking_endpoint(
    booking_data: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new booking"""
    try:
        # Verify vehicle exists and is available
        vehicle = await get_vehicle_by_id(db, booking_data.vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {booking_data.vehicle_id} not found"
            )

        if not vehicle.isAvailable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle is not available for booking"
            )

        # Handle customer - either from authenticated user or create/find by phone
        customer_id = booking_data.customer_id
        if not customer_id and booking_data.contact_phone:
            # For guest bookings, try to find existing customer by phone or create new one
            from app.db.crud import get_customer_by_phone, create_customer

            # Extract name parts from contact_name
            name_parts = (booking_data.contact_name or "Guest User").split(" ", 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else "User"

            existing = await get_customer_by_phone(db, booking_data.contact_phone)
            if existing:
                customer_id = existing.id
            else:
                # Create new guest customer with phone number (no password needed)
                customer = await create_customer(
                    db=db,
                    first_name=first_name,
                    last_name=last_name,
                    email=booking_data.contact_email or f"{booking_data.contact_phone}@guest.tmp",
                    phone=booking_data.contact_phone,
                    password=None  # No password for phone-based auth
                )
                customer_id = customer.id
        elif not customer_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either customer_id (for authenticated users) or contact_phone (for guest bookings) must be provided"
            )

        # Calculate pricing
        estimated_distance = booking_data.estimated_distance_km or Decimal("100")
        estimated_duration = booking_data.estimated_duration_hours

        # Convert trip_type from lowercase (one_way) to uppercase (ONE_WAY) for database ENUM
        trip_type_upper = booking_data.trip_type.upper().replace('-', '_')

        # Calculate price using pricing service - convert camelCase to snake_case
        price_breakdown = await pricing_service.calculate_price(
            vehicle_data={
                "price_per_km": vehicle.pricePerKm,
                "minimum_charge": vehicle.minimumCharge,
                "driver_allowance_per_day": vehicle.driverAllowancePerDay,
                "minimum_days": vehicle.minimumDays
            },
            trip_type=trip_type_upper,
            distance_km=estimated_distance,
            duration_hours=estimated_duration,
            start_date=make_naive(booking_data.start_date),
            end_date=make_naive(booking_data.end_date),
            include_toll=True,
            promo_discount=None,
            promo_code=booking_data.promo_code
        )

        # Create booking - convert timezone-aware datetimes to naive datetimes
        booking = await create_booking(
            db=db,
            customer_id=customer_id,
            vehicle_id=booking_data.vehicle_id,
            trip_type=trip_type_upper,
            start_date=make_naive(booking_data.start_date),
            pickup_location=booking_data.pickup_location.address,
            pickup_time=make_naive(booking_data.pickup_time),
            drop_location=booking_data.drop_location.address,
            end_date=make_naive(booking_data.end_date) if booking_data.end_date else None,
            pickup_landmark=booking_data.pickup_location.landmark,
            pickup_lat=booking_data.pickup_location.latitude,
            pickup_lng=booking_data.pickup_location.longitude,
            drop_landmark=booking_data.drop_location.landmark,
            drop_lat=booking_data.drop_location.latitude,
            drop_lng=booking_data.drop_location.longitude,
            return_pickup_location=booking_data.return_pickup_location.address if booking_data.return_pickup_location else None,
            return_drop_location=booking_data.return_drop_location.address if booking_data.return_drop_location else None,
            return_pickup_time=make_naive(booking_data.return_pickup_time) if booking_data.return_pickup_time else None,
            estimated_distance_km=estimated_distance,
            estimated_duration_hours=estimated_duration,
            passenger_count=booking_data.passenger_count,
            base_fare=float(price_breakdown["base_fare"]),
            distance_charge=float(price_breakdown["distance_charge"]),
            driver_allowance=float(price_breakdown["driver_allowance"]),
            toll_charges=float(price_breakdown["toll_charges"]),
            parking_charges=float(price_breakdown["parking_charges"]),
            night_halt_charges=float(price_breakdown["night_halt_charges"]),
            service_tax=float(price_breakdown["service_tax"]),
            discount=float(price_breakdown["discount"]),
            total_amount=float(price_breakdown["total_amount"]),
            advance_paid=float(price_breakdown.get("advance_required", 0)),
            special_requests=booking_data.special_requests,
            notes=booking_data.notes,
            promo_code=booking_data.promo_code
        )

        return {
            "id": booking.id,
            "bookingNumber": booking.bookingNumber,
            "status": booking.status.value,
            "totalAmount": float(booking.totalAmount),
            "advanceRequired": float(price_breakdown.get("advance_required", 0)),
            "message": "Booking created successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating booking: {str(e)}"
        )


@router.get(
    "",
    response_model=List[dict],
    summary="List bookings",
    description="Get bookings with optional filtering for customer/admin"
)
async def list_bookings_endpoint(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by booking status"),
    vehicle_id: Optional[str] = Query(None, description="Filter by vehicle ID"),
    date_from: Optional[datetime] = Query(None, description="Filter by start date from"),
    date_to: Optional[datetime] = Query(None, description="Filter by start date to"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List bookings with filtering"""
    try:
        bookings = await get_bookings(
            db=db,
            skip=(page - 1) * page_size,
            limit=page_size,
            customer_id=customer_id,
            status=status_filter,
            vehicle_id=vehicle_id
        )

        result = []
        for booking in bookings:
            result.append({
                "id": booking.id,
                "bookingNumber": booking.bookingNumber,
                "customerId": booking.customerId,
                "vehicleId": booking.vehicleId,
                "tripType": booking.tripType.value,
                "startDate": booking.startDate.isoformat() if booking.startDate else None,
                "endDate": booking.endDate.isoformat() if booking.endDate else None,
                "pickupLocation": booking.pickupLocation,
                "dropLocation": booking.dropLocation,
                "status": booking.status.value,
                "totalAmount": float(booking.totalAmount),
                "createdAt": booking.createdAt.isoformat() if booking.createdAt else None,
            })

        return result

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching bookings: {str(e)}"
        )


@router.get(
    "/{booking_id}",
    response_model=dict,
    summary="Get booking by ID",
    description="Get detailed information about a specific booking"
)
async def get_booking_endpoint(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get booking details by ID"""
    try:
        booking = await get_booking_by_id(db, booking_id)

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking with ID {booking_id} not found"
            )

        return {
            "id": booking.id,
            "bookingNumber": booking.bookingNumber,
            "customerId": booking.customerId,
            "vehicleId": booking.vehicleId,
            "tripType": booking.tripType.value,
            "startDate": booking.startDate.isoformat() if booking.startDate else None,
            "endDate": booking.endDate.isoformat() if booking.endDate else None,
            "pickupLocation": booking.pickupLocation,
            "pickupLandmark": booking.pickupLandmark,
            "pickupLat": float(booking.pickupLat) if booking.pickupLat else None,
            "pickupLng": float(booking.pickupLng) if booking.pickupLng else None,
            "pickupTime": booking.pickupTime.isoformat() if booking.pickupTime else None,
            "dropLocation": booking.dropLocation,
            "dropLandmark": booking.dropLandmark,
            "dropLat": float(booking.dropLat) if booking.dropLat else None,
            "dropLng": float(booking.dropLng) if booking.dropLng else None,
            "returnPickupLocation": booking.returnPickupLocation,
            "returnDropLocation": booking.returnDropLocation,
            "returnPickupTime": booking.returnPickupTime.isoformat() if booking.returnPickupTime else None,
            "estimatedDistanceKm": float(booking.estimatedDistanceKm) if booking.estimatedDistanceKm else None,
            "estimatedDurationHours": float(booking.estimatedDurationHours) if booking.estimatedDurationHours else None,
            "passengerCount": booking.passengerCount,
            "baseFare": float(booking.baseFare),
            "distanceCharge": float(booking.distanceCharge),
            "driverAllowance": float(booking.driverAllowance),
            "tollCharges": float(booking.tollCharges),
            "parkingCharges": float(booking.parkingCharges),
            "nightHaltCharges": float(booking.nightHaltCharges),
            "serviceTax": float(booking.serviceTax),
            "discount": float(booking.discount),
            "totalAmount": float(booking.totalAmount),
            "advancePaid": float(booking.advancePaid),
            "balanceAmount": float(booking.balanceAmount),
            "status": booking.status.value,
            "specialRequests": booking.specialRequests,
            "notes": booking.notes,
            "createdAt": booking.createdAt.isoformat() if booking.createdAt else None,
            "confirmedAt": booking.confirmedAt.isoformat() if booking.confirmedAt else None,
            "completedAt": booking.completedAt.isoformat() if booking.completedAt else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching booking: {str(e)}"
        )


@router.get(
    "/number/{booking_number}",
    response_model=dict,
    summary="Get booking by number",
    description="Get booking details using booking number"
)
async def get_booking_by_number_endpoint(
    booking_number: str,
    db: AsyncSession = Depends(get_db)
):
    """Get booking by booking number"""
    try:
        booking = await get_booking_by_number(db, booking_number)

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking with number {booking_number} not found"
            )

        return {
            "id": booking.id,
            "bookingNumber": booking.bookingNumber,
            "customerId": booking.customer_id,
            "vehicleId": booking.vehicle_id,
            "status": booking.status.value,
            "totalAmount": float(booking.total_amount),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching booking: {str(e)}"
        )


@router.put(
    "/{booking_id}/cancel",
    response_model=SuccessResponse,
    summary="Cancel booking",
    description="Cancel a booking (PENDING or CONFIRMED bookings only)"
)
async def cancel_booking_endpoint(
    booking_id: str,
    status_update: BookingStatusUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a booking"""
    try:
        booking = await cancel_booking_crud(
            db=db,
            booking_id=booking_id,
            reason=status_update.reason,
            cancelled_by="CUSTOMER"
        )

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking with ID {booking_id} not found"
            )

        return SuccessResponse(
            success=True,
            message="Booking cancelled successfully"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelling booking: {str(e)}"
        )


@router.put(
    "/{booking_id}/confirm",
    response_model=dict,
    summary="Confirm booking",
    description="Confirm a pending booking (Admin/Driver action)"
)
async def confirm_booking_endpoint(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Confirm a booking"""
    try:
        booking = await update_booking_status(db, booking_id, BookingStatus.CONFIRMED)

        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking with ID {booking_id} not found"
            )

        return {
            "id": booking.id,
            "bookingNumber": booking.bookingNumber,
            "status": booking.status.value,
            "message": "Booking confirmed successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error confirming booking: {str(e)}"
        )


@router.post(
    "/estimate",
    response_model=dict,
    summary="Get price estimate",
    description="Get price estimate for a trip without creating a booking"
)
async def get_price_estimate_endpoint(
    request: PriceEstimateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Calculate price estimate for a trip"""
    try:
        # Get vehicle details
        vehicle = await get_vehicle_by_id(db, request.vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {request.vehicle_id} not found"
            )

        # Calculate price
        price_breakdown = await pricing_service.calculate_price(
            vehicle_data={
                "price_per_km": vehicle.price_per_km,
                "minimum_charge": vehicle.minimum_charge,
                "driver_allowance_per_day": vehicle.driver_allowance_per_day,
                "minimum_days": vehicle.minimum_days
            },
            trip_type=request.trip_type,
            distance_km=request.estimated_distance_km,
            duration_hours=request.estimated_duration_hours,
            start_date=request.start_date,
            end_date=request.end_date,
            include_toll=request.include_toll_charges,
            include_parking=request.include_parking_charges,
            promo_discount=None,
            promo_code=request.promo_code
        )

        return {
            "vehicleId": request.vehicle_id,
            "vehicleName": vehicle.name,
            "tripType": request.trip_type,
            "baseFare": float(price_breakdown["base_fare"]),
            "distanceCharge": float(price_breakdown["distance_charge"]),
            "driverAllowance": float(price_breakdown["driver_allowance"]),
            "tollCharges": float(price_breakdown["toll_charges"]),
            "parkingCharges": float(price_breakdown["parking_charges"]),
            "nightHaltCharges": float(price_breakdown["night_halt_charges"]),
            "subtotal": float(price_breakdown["subtotal"]),
            "serviceTax": float(price_breakdown["service_tax"]),
            "discount": float(price_breakdown["discount"]),
            "totalAmount": float(price_breakdown["total_amount"]),
            "minimumGuarantee": float(price_breakdown.get("minimum_guarantee", 0)),
            "advanceRequired": float(price_breakdown.get("advance_required", 0)),
            "balancePayable": float(price_breakdown.get("balance_payable", 0)),
            "breakdown": price_breakdown.get("breakdown", [])
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating estimate: {str(e)}"
        )
