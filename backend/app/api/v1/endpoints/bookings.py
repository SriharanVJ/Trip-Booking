"""Booking endpoints for the vehicle booking API"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from uuid import uuid4
import random

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

        if not vehicle.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vehicle is not available for booking"
            )

        # For now, use customer_id from request or create a guest customer
        # In production, this would come from JWT token
        customer_id = booking_data.customer_id
        if not customer_id:
            # Check if email exists, if not create guest
            from app.db.crud import get_customer_by_email, create_customer
            existing = await get_customer_by_email(db, booking_data.contact_email or f"guest_{uuid4()}@temp.com")
            if existing:
                customer_id = existing.id
            else:
                customer = await create_customer(
                    db=db,
                    first_name=booking_data.contact_name or "Guest",
                    last_name="User",
                    email=booking_data.contact_email or f"guest_{uuid4()}@temp.com",
                    password=str(uuid4()),  # Random password for guest
                    phone=booking_data.contact_phone or "0000000000"
                )
                customer_id = customer.id

        # Calculate pricing
        estimated_distance = booking_data.estimated_distance_km or Decimal("100")
        estimated_duration = booking_data.estimated_duration_hours

        # Calculate price using pricing service
        price_breakdown = await pricing_service.calculate_price(
            vehicle_data={
                "price_per_km": vehicle.price_per_km,
                "minimum_charge": vehicle.minimum_charge,
                "driver_allowance_per_day": vehicle.driver_allowance_per_day,
                "minimum_days": vehicle.minimum_days
            },
            trip_type=booking_data.trip_type,
            distance_km=estimated_distance,
            duration_hours=estimated_duration,
            start_date=booking_data.start_date,
            end_date=booking_data.end_date,
            include_toll=True,
            promo_discount=None,
            promo_code=booking_data.promo_code
        )

        # Create booking
        booking = await create_booking(
            db=db,
            customer_id=customer_id,
            vehicle_id=booking_data.vehicle_id,
            trip_type=booking_data.trip_type,
            start_date=booking_data.start_date,
            pickup_location=booking_data.pickup_location.address,
            pickup_time=booking_data.pickup_time,
            drop_location=booking_data.drop_location.address,
            end_date=booking_data.end_date,
            pickup_landmark=booking_data.pickup_location.landmark,
            pickup_lat=booking_data.pickup_location.latitude,
            pickup_lng=booking_data.pickup_location.longitude,
            drop_landmark=booking_data.drop_location.landmark,
            drop_lat=booking_data.drop_location.latitude,
            drop_lng=booking_data.drop_location.longitude,
            return_pickup_location=booking_data.return_pickup_location.address if booking_data.return_pickup_location else None,
            return_drop_location=booking_data.return_drop_location.address if booking_data.return_drop_location else None,
            return_pickup_time=booking_data.return_pickup_time,
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
            "bookingNumber": booking.booking_number,
            "status": booking.status.value,
            "totalAmount": float(booking.total_amount),
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
                "bookingNumber": booking.booking_number,
                "customerId": booking.customer_id,
                "vehicleId": booking.vehicle_id,
                "tripType": booking.trip_type.value,
                "startDate": booking.start_date.isoformat() if booking.start_date else None,
                "endDate": booking.end_date.isoformat() if booking.end_date else None,
                "pickupLocation": booking.pickup_location,
                "dropLocation": booking.drop_location,
                "status": booking.status.value,
                "totalAmount": float(booking.total_amount),
                "createdAt": booking.created_at.isoformat() if booking.created_at else None,
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
            "bookingNumber": booking.booking_number,
            "customerId": booking.customer_id,
            "vehicleId": booking.vehicle_id,
            "tripType": booking.trip_type.value,
            "startDate": booking.start_date.isoformat() if booking.start_date else None,
            "endDate": booking.end_date.isoformat() if booking.end_date else None,
            "pickupLocation": booking.pickup_location,
            "pickupLandmark": booking.pickup_landmark,
            "pickupLat": float(booking.pickup_lat) if booking.pickup_lat else None,
            "pickupLng": float(booking.pickup_lng) if booking.pickup_lng else None,
            "pickupTime": booking.pickup_time.isoformat() if booking.pickup_time else None,
            "dropLocation": booking.drop_location,
            "dropLandmark": booking.drop_landmark,
            "dropLat": float(booking.drop_lat) if booking.drop_lat else None,
            "dropLng": float(booking.drop_lng) if booking.drop_lng else None,
            "returnPickupLocation": booking.return_pickup_location,
            "returnDropLocation": booking.return_drop_location,
            "returnPickupTime": booking.return_pickup_time.isoformat() if booking.return_pickup_time else None,
            "estimatedDistanceKm": float(booking.estimated_distance_km) if booking.estimated_distance_km else None,
            "estimatedDurationHours": float(booking.estimated_duration_hours) if booking.estimated_duration_hours else None,
            "passengerCount": booking.passenger_count,
            "baseFare": float(booking.base_fare),
            "distanceCharge": float(booking.distance_charge),
            "driverAllowance": float(booking.driver_allowance),
            "tollCharges": float(booking.toll_charges),
            "parkingCharges": float(booking.parking_charges),
            "nightHaltCharges": float(booking.night_halt_charges),
            "serviceTax": float(booking.service_tax),
            "discount": float(booking.discount),
            "totalAmount": float(booking.total_amount),
            "advancePaid": float(booking.advance_paid),
            "balanceAmount": float(booking.balance_amount),
            "status": booking.status.value,
            "specialRequests": booking.special_requests,
            "notes": booking.notes,
            "createdAt": booking.created_at.isoformat() if booking.created_at else None,
            "confirmedAt": booking.confirmed_at.isoformat() if booking.confirmed_at else None,
            "completedAt": booking.completed_at.isoformat() if booking.completed_at else None,
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
            "bookingNumber": booking.booking_number,
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
            "bookingNumber": booking.booking_number,
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
