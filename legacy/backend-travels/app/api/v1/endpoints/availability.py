"""Availability endpoints for the vehicle booking API"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.db.session import get_db
from app.db.crud import get_vehicles, check_vehicle_availability, get_available_vehicles_for_dates
from app.db.models import VehicleType

router = APIRouter()


@router.get(
    "/vehicles",
    response_model=List[dict],
    summary="Get available vehicles by date",
    description="Get available vehicles for a date range"
)
async def get_available_vehicles_by_date(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    min_capacity: Optional[int] = Query(None, ge=1, description="Minimum seating capacity"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: AsyncSession = Depends(get_db)
):
    """Get available vehicles for date range"""
    try:
        # Parse vehicle type
        vtype = None
        if vehicle_type:
            try:
                vtype = VehicleType(vehicle_type)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid vehicle type: {vehicle_type}"
                )

        # Get available vehicles
        vehicles = await get_available_vehicles_for_dates(
            db=db,
            start_date=start_date,
            end_date=end_date,
            vehicle_type=vtype,
            min_capacity=min_capacity
        )

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
                "images": vehicle.images or [],
                "thumbnailImage": vehicle.thumbnail_image,
                "description": vehicle.description,
                "rating": float(vehicle.rating) if vehicle.rating else 0,
            })

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking availability: {str(e)}"
        )


@router.get(
    "/vehicle/{vehicle_id}",
    response_model=List[dict],
    summary="Check specific vehicle availability",
    description="Get detailed availability for a specific vehicle"
)
async def check_vehicle_availability_detail(
    vehicle_id: str,
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    include_bookings: bool = Query(False, description="Include booking details"),
    db: AsyncSession = Depends(get_db)
):
    """Check detailed availability for a specific vehicle"""
    try:
        from app.db.crud import get_vehicle_by_id

        # Verify vehicle exists
        vehicle = await get_vehicle_by_id(db, vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {vehicle_id} not found"
            )

        # Check availability
        is_available = await check_vehicle_availability(db, vehicle_id, start_date, end_date)

        # Return availability for each day in range
        availabilities = []
        current_date = start_date.date()
        end = end_date.date()

        while current_date <= end:
            day_start = datetime.combine(current_date, datetime.min.time())
            day_end = datetime.combine(current_date, datetime.max.time())

            # Check if available for this specific day
            day_available = await check_vehicle_availability(db, vehicle_id, day_start, day_end)

            availabilities.append({
                "vehicle_id": vehicle_id,
                "date": day_start.isoformat(),
                "start_time": "00:00",
                "end_time": "23:59",
                "is_available": day_available,
                "booking_id": None,
                "is_maintenance": False,
                "maintenance_reason": None
            })
            current_date += timedelta(days=1)

        return availabilities

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking availability: {str(e)}"
        )


@router.post(
    "/vehicle/{vehicle_id}/block",
    response_model=dict,
    summary="Block vehicle availability",
    description="Block vehicle for maintenance or other reasons (Admin only)"
)
async def block_vehicle_availability(
    vehicle_id: str,
    start_date: datetime,
    end_date: datetime,
    reason: str = Query(..., description="Reason for blocking"),
    is_maintenance: bool = Query(False, description="Is this a maintenance block"),
    db: AsyncSession = Depends(get_db)
):
    """Block vehicle availability for a date range (mock - not implemented with SQLAlchemy yet)"""
    try:
        from app.db.crud import get_vehicle_by_id

        # Verify vehicle exists
        vehicle = await get_vehicle_by_id(db, vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {vehicle_id} not found"
            )

        # For now, just return success - actual blocking would require VehicleAvailability CRUD
        # TODO: Implement VehicleAvailability CRUD operations

        days = (end_date.date() - start_date.date()).days + 1

        return {
            "success": True,
            "message": f"Note: Vehicle blocking not fully implemented. Would block vehicle {vehicle_id} for {days} days",
            "blocks_created": days
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error blocking vehicle: {str(e)}"
        )


@router.delete(
    "/vehicle/{vehicle_id}/block",
    response_model=dict,
    summary="Remove vehicle availability block",
    description="Remove availability block for vehicle (Admin only)"
)
async def unblock_vehicle_availability(
    vehicle_id: str,
    start_date: datetime,
    end_date: datetime,
    db: AsyncSession = Depends(get_db)
):
    """Remove availability blocks for a vehicle (mock - not implemented yet)"""
    try:
        from app.db.crud import get_vehicle_by_id

        # Verify vehicle exists
        vehicle = await get_vehicle_by_id(db, vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {vehicle_id} not found"
            )

        # For now, just return success
        return {
            "success": True,
            "message": "Note: Vehicle unblocking not fully implemented",
            "blocks_removed": 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error unblocking vehicle: {str(e)}"
        )


@router.get(
    "/summary",
    response_model=dict,
    summary="Get availability summary",
    description="Get summary of vehicle availability for a date range"
)
async def get_availability_summary(
    start_date: datetime = Query(..., description="Start date"),
    end_date: datetime = Query(..., description="End date"),
    group_by_type: bool = Query(True, description="Group summary by vehicle type"),
    db: AsyncSession = Depends(get_db)
):
    """Get availability summary statistics"""
    try:
        # Get all vehicles
        all_vehicles = await get_vehicles(db, skip=0, limit=1000, available_only=False)

        total_vehicles = len(all_vehicles)

        # Get available vehicles for the date range
        available_vehicles = await get_available_vehicles_for_dates(
            db=db,
            start_date=start_date,
            end_date=end_date
        )

        available_count = len(available_vehicles)
        booked_count = total_vehicles - available_count

        summary = {
            "total_vehicles": total_vehicles,
            "available_vehicles": available_count,
            "booked_vehicles": booked_count,
            "utilization_percentage": round((booked_count / total_vehicles * 100) if total_vehicles > 0 else 0, 2),
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            }
        }

        if group_by_type:
            # Group by vehicle type
            type_summary = {}

            for vehicle in all_vehicles:
                vtype = vehicle.type.value
                if vtype not in type_summary:
                    type_summary[vtype] = {
                        "total": 0,
                        "available": 0,
                        "booked": 0
                    }

                type_summary[vtype]["total"] += 1
                if any(v.id == vehicle.id for v in available_vehicles):
                    type_summary[vtype]["available"] += 1
                else:
                    type_summary[vtype]["booked"] += 1

            summary["by_type"] = type_summary

        return summary

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting availability summary: {str(e)}"
        )
