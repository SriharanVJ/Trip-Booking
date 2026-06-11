"""Admin endpoints"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.session import get_db
from app.db.crud import (
    get_vehicles,
    create_vehicle,
    delete_vehicle,
    get_bookings,
    get_booking_by_id,
    update_booking_status
)
from app.db.models import Vehicle, Booking, BookingStatus, VehicleType
from app.core.deps import get_current_admin
from app.schemas.user import AdminResponse

router = APIRouter()


@router.get("/dashboard")
async def get_admin_dashboard(
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get admin dashboard statistics"""
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Get counts
    total_vehicles = len(await get_vehicles(db, skip=0, limit=1000, available_only=False))

    # Get booking counts
    all_bookings = await get_bookings(db, skip=0, limit=10000)
    total_bookings = len(all_bookings)

    # Calculate revenue
    total_revenue = sum(float(b.total_amount) for b in all_bookings)

    # Get today's bookings
    today_bookings = [b for b in all_bookings if b.created_at and b.created_at >= today]
    today_count = len(today_bookings)
    today_revenue = sum(float(b.total_amount) for b in today_bookings)

    # Get active bookings
    active_bookings = [b for b in all_bookings if b.status in [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]]

    # Get recent bookings (last 10)
    recent_bookings = []
    for booking in all_bookings[:10]:
        recent_bookings.append({
            "id": booking.id,
            "bookingNumber": booking.booking_number,
            "customerId": booking.customer_id,
            "vehicleId": booking.vehicle_id,
            "status": booking.status.value,
            "totalAmount": float(booking.total_amount),
            "createdAt": booking.created_at.isoformat() if booking.created_at else None,
        })

    return {
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "active_bookings": len(active_bookings),
        "total_vehicles": total_vehicles,
        "available_vehicles": len(await get_vehicles(db, skip=0, limit=1000, available_only=True)),
        "today_bookings": today_count,
        "today_revenue": today_revenue,
        "recent_bookings": recent_bookings,
    }


@router.get("/vehicles")
async def get_all_vehicles_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    vehicle_type: Optional[str] = None,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all vehicles (admin)"""
    vtype = None
    if vehicle_type:
        try:
            vtype = VehicleType(vehicle_type)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid vehicle type: {vehicle_type}")

    vehicles = await get_vehicles(db, skip=skip, limit=limit, vehicle_type=vtype, available_only=False)

    result = []
    for vehicle in vehicles:
        result.append({
            "id": vehicle.id,
            "registrationNumber": vehicle.registration_number,
            "name": vehicle.name,
            "type": vehicle.type.value,
            "seatingCapacity": vehicle.seating_capacity,
            "isAvailable": vehicle.is_available,
            "pricePerKm": float(vehicle.price_per_km),
            "minimumCharge": float(vehicle.minimum_charge),
            "driverAllowancePerDay": float(vehicle.driver_allowance_per_day),
            "amenities": vehicle.amenities or [],
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "fuelType": vehicle.fuel_type,
            "color": vehicle.color,
            "rating": float(vehicle.rating) if vehicle.rating else 0,
            "createdAt": vehicle.created_at.isoformat() if vehicle.created_at else None,
        })

    return result


@router.post("/vehicles")
async def create_new_vehicle(
    registration_number: str,
    name: str,
    vehicle_type: str,
    seating_capacity: int,
    price_per_km: float,
    minimum_charge: float,
    driver_allowance_per_day: float,
    make: Optional[str] = None,
    model: Optional[str] = None,
    year: Optional[int] = None,
    fuel_type: Optional[str] = None,
    color: Optional[str] = None,
    amenities: Optional[List[str]] = None,
    description: Optional[str] = None,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create a new vehicle (admin)"""
    try:
        vtype = VehicleType(vehicle_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid vehicle type: {vehicle_type}")

    vehicle = await create_vehicle(
        db=db,
        registration_number=registration_number,
        name=name,
        vehicle_type=vtype,
        seating_capacity=seating_capacity,
        price_per_km=price_per_km,
        minimum_charge=minimum_charge,
        driver_allowance_per_day=driver_allowance_per_day,
        make=make,
        model=model,
        year=year,
        fuel_type=fuel_type,
        color=color,
        amenities=amenities or [],
        description=description
    )

    return {
        "id": vehicle.id,
        "registrationNumber": vehicle.registration_number,
        "name": vehicle.name,
        "type": vehicle.type.value,
        "message": "Vehicle created successfully"
    }


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle_endpoint(
    vehicle_id: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a vehicle (admin)"""
    success = await delete_vehicle(db, vehicle_id)

    if not success:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    return {"message": "Vehicle deleted successfully"}


@router.get("/bookings")
async def get_all_bookings_admin(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status_filter: Optional[str] = None,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get all bookings (admin)"""
    bookings = await get_bookings(
        db=db,
        skip=skip,
        limit=limit,
        status=status_filter
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
            "paymentStatus": booking.payment_status.value,
            "totalAmount": float(booking.total_amount),
            "advancePaid": float(booking.advance_paid),
            "balanceAmount": float(booking.balance_amount),
            "createdAt": booking.created_at.isoformat() if booking.created_at else None,
        })

    return result


@router.patch("/bookings/{booking_id}/status")
async def update_booking_status_admin(
    booking_id: str,
    status: str,
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update booking status (admin)"""
    try:
        booking_status = BookingStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid booking status: {status}")

    booking = await update_booking_status(db, booking_id, booking_status)

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    return {
        "id": booking.id,
        "bookingNumber": booking.booking_number,
        "status": booking.status.value,
        "message": "Booking status updated successfully"
    }


@router.get("/reports")
async def get_reports(
    report_type: str = Query("revenue", description="Type of report: revenue, bookings, vehicles"),
    start_date: Optional[datetime] = Query(None, description="Start date for report"),
    end_date: Optional[datetime] = Query(None, description="End date for report"),
    current_admin = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get various reports"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    if report_type == "revenue":
        # Revenue report
        bookings = await get_bookings(db, skip=0, limit=10000)
        filtered = [b for b in bookings if b.created_at and start_date <= b.created_at <= end_date]

        total_revenue = sum(float(b.total_amount) for b in filtered)
        confirmed_revenue = sum(float(b.total_amount) for b in filtered if b.status == BookingStatus.COMPLETED)
        pending_revenue = sum(float(b.total_amount) for b in filtered if b.status == BookingStatus.PENDING)

        return {
            "report_type": "revenue",
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total_revenue": total_revenue,
            "confirmed_revenue": confirmed_revenue,
            "pending_revenue": pending_revenue,
            "total_bookings": len(filtered),
        }

    elif report_type == "bookings":
        # Bookings report
        bookings = await get_bookings(db, skip=0, limit=10000)
        filtered = [b for b in bookings if b.created_at and start_date <= b.created_at <= end_date]

        status_breakdown = {}
        for status in BookingStatus:
            status_breakdown[status.value] = len([b for b in filtered if b.status == status])

        return {
            "report_type": "bookings",
            "period": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "total_bookings": len(filtered),
            "status_breakdown": status_breakdown,
        }

    elif report_type == "vehicles":
        # Vehicles report
        vehicles = await get_vehicles(db, skip=0, limit=1000, available_only=False)

        type_breakdown = {}
        for vtype in VehicleType:
            type_breakdown[vtype.value] = len([v for v in vehicles if v.type == vtype])

        available = len([v for v in vehicles if v.is_available])

        return {
            "report_type": "vehicles",
            "total_vehicles": len(vehicles),
            "available_vehicles": available,
            "unavailable_vehicles": len(vehicles) - available,
            "type_breakdown": type_breakdown,
        }

    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")
