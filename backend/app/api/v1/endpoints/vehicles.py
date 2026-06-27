"""Vehicle endpoints for the booking API"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.db.session import get_db
from app.db.crud import get_vehicles, get_vehicle_by_id, get_available_vehicles_for_dates
from app.db.models import VehicleType
from app.schemas.vehicle import (
    VehicleResponse,
    VehicleDetailResponse,
    VehicleCategory,
    VehicleTypeResponse,
    VehicleAvailabilityRequest,
    VehicleAvailabilityResponse,
    ErrorResponse,
    SuccessResponse
)

router = APIRouter()


# Vehicle type definitions
VEHICLE_CATEGORIES = {
    "CAR_5_SEATER": {
        "display_name": "5 Seater Car",
        "description": "Comfortable sedan or hatchback for small groups",
        "capacity_range": "4-5 passengers",
        "typical_uses": ["Local transfers", "Airport pickups", "City tours", "Short outstation trips"]
    },
    "CAR_7_SEATER": {
        "display_name": "7 Seater Car",
        "description": "Spacious SUV or MPV for medium groups",
        "capacity_range": "6-7 passengers",
        "typical_uses": ["Family trips", "Group transfers", "Outstation travel", "Weekend getaways"]
    },
    "CAR_9_SEATER": {
        "display_name": "9 Seater Vehicle",
        "description": "Large van or MPV for bigger groups",
        "capacity_range": "8-9 passengers",
        "typical_uses": ["Corporate events", "Large family groups", "Team outings"]
    },
    "TRAVELLER_14_SEATER": {
        "display_name": "14 Seater Traveller",
        "description": "Comfortable tempo traveller for medium-sized groups",
        "capacity_range": "12-14 passengers",
        "typical_uses": ["Corporate retreats", "School trips", "Pilgrimage tours", "Group excursions"]
    },
    "COACH_21_SEATER": {
        "display_name": "21 Seater Coach",
        "description": "Mini coach with premium amenities",
        "capacity_range": "18-21 passengers",
        "typical_uses": ["Corporate travel", "Wedding shuttles", "Tour groups", "Event transportation"]
    },
    "COACH_24_SEATER": {
        "display_name": "24 Seater Coach",
        "description": "Spacious coach for larger groups",
        "capacity_range": "22-24 passengers",
        "typical_uses": ["Large corporate events", "Wedding guest transport", "Extended tour groups"]
    },
    "BUS_52_SEATER": {
        "display_name": "52 Seater Bus",
        "description": "Full-size luxury bus for large groups",
        "capacity_range": "45-52 passengers",
        "typical_uses": ["Large corporate events", "Wedding transportation", "Long-distance tours", "Pilgrimage tours"]
    }
}


@router.get(
    "",
    response_model=List[dict],
    summary="List all vehicles",
    description="Get a paginated list of vehicles with optional filtering"
)
async def list_vehicles(
    type: Optional[str] = Query(None, description="Filter by vehicle type"),
    min_capacity: Optional[int] = Query(None, ge=1, description="Minimum seating capacity"),
    max_capacity: Optional[int] = Query(None, ge=1, description="Maximum seating capacity"),
    min_price: Optional[float] = Query(None, ge=0, description="Minimum price per km"),
    max_price: Optional[float] = Query(None, ge=0, description="Maximum price per km"),
    amenities: Optional[str] = Query(None, description="Comma-separated list of required amenities"),
    location: Optional[str] = Query(None, description="Filter by location/availability"),
    available_only: bool = Query(True, description="Show only available vehicles"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: Optional[str] = Query("created_at", description="Sort field"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc/desc)"),
    db: AsyncSession = Depends(get_db)
):
    """List all vehicles with filtering and pagination"""
    try:
        # Parse vehicle type
        vtype = None
        if type:
            try:
                vtype = VehicleType(type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid vehicle type: {type}")

        # Get vehicles
        vehicles = await get_vehicles(
            db=db,
            skip=(page - 1) * page_size,
            limit=page_size,
            vehicle_type=vtype,
            available_only=available_only
        )

        # Post-process filters (for capacity, price, amenities)
        filtered = []
        for vehicle in vehicles:
            # Filter by capacity
            if min_capacity and vehicle.seatingCapacity < min_capacity:
                continue
            if max_capacity and vehicle.seatingCapacity > max_capacity:
                continue

            # Filter by price
            vehicle_price = float(vehicle.pricePerKm)
            if min_price and vehicle_price < min_price:
                continue
            if max_price and vehicle_price > max_price:
                continue

            # Filter by amenities
            if amenities:
                amenity_list = [a.strip() for a in amenities.split(",")]
                vehicle_amenities = vehicle.amenities or []
                if not all(amenity in vehicle_amenities for amenity in amenity_list):
                    continue

            filtered.append({
                "id": vehicle.id,
                "registrationNumber": vehicle.registrationNumber,
                "name": vehicle.name,
                "type": vehicle.type.value,
                "seatingCapacity": vehicle.seatingCapacity,
                "isAvailable": vehicle.isAvailable,
                "pricePerKm": float(vehicle.pricePerKm),
                "pricePerDay": float(vehicle.pricePerDay) if hasattr(vehicle, 'pricePerDay') and vehicle.pricePerDay else float(vehicle.pricePerKm) * 200,
                "minimumCharge": float(vehicle.minimumCharge),
                "driverAllowancePerDay": float(vehicle.driverAllowancePerDay),
                "minimumDays": vehicle.minimumDays,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "fuelType": vehicle.fuelType,
                "color": vehicle.color,
                "amenities": vehicle.amenities or [],
                "images": vehicle.images or [],
                "thumbnailImage": vehicle.thumbnailImage,
                "description": vehicle.description,
                "rating": float(vehicle.rating) if vehicle.rating else 0,
                "reviewCount": vehicle.reviewCount,
                "createdAt": vehicle.createdAt.isoformat() if vehicle.createdAt else None,
                "updatedAt": vehicle.updatedAt.isoformat() if vehicle.updatedAt else None,
            })

        return filtered

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicles: {str(e)}"
        )


@router.get(
    "/categories",
    response_model=List[VehicleCategory],
    summary="Get vehicle categories",
    description="Get all vehicle type categories with descriptions"
)
async def get_vehicle_categories():
    """Get all vehicle categories with detailed information"""
    return [
        VehicleCategory(
            type=vt,
            display_name=cat["display_name"],
            description=cat["description"],
            capacity_range=cat["capacity_range"],
            typical_uses=cat["typical_uses"]
        )
        for vt, cat in VEHICLE_CATEGORIES.items()
    ]


@router.get(
    "/types",
    response_model=VehicleTypeResponse,
    summary="Get vehicle types",
    description="Get list of all available vehicle types"
)
async def get_vehicle_types():
    """Get all available vehicle types"""
    return VehicleTypeResponse(
        types=list(VEHICLE_CATEGORIES.keys())
    )


@router.get(
    "/available",
    response_model=List[dict],
    summary="Check available vehicles",
    description="Get vehicles available for a specific date range"
)
async def get_available_vehicles_endpoint(
    start_date: datetime = Query(..., description="Start date and time"),
    end_date: datetime = Query(..., description="End date and time"),
    vehicle_type: Optional[str] = Query(None, description="Filter by vehicle type"),
    min_capacity: Optional[int] = Query(None, ge=1, description="Minimum seating capacity"),
    db: AsyncSession = Depends(get_db)
):
    """Get vehicles available for the specified date range"""
    try:
        # Parse vehicle type
        vtype = None
        if vehicle_type:
            try:
                vtype = VehicleType(vehicle_type)
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid vehicle type: {vehicle_type}")

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
                "registrationNumber": vehicle.registrationNumber,
                "name": vehicle.name,
                "type": vehicle.type.value,
                "seatingCapacity": vehicle.seatingCapacity,
                "isAvailable": vehicle.isAvailable,
                "pricePerKm": float(vehicle.pricePerKm),
                "pricePerDay": float(vehicle.pricePerDay) if hasattr(vehicle, 'pricePerDay') and vehicle.pricePerDay else float(vehicle.pricePerKm) * 200,
                "minimumCharge": float(vehicle.minimumCharge),
                "amenities": vehicle.amenities or [],
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
    "/{vehicle_id}",
    response_model=dict,
    summary="Get vehicle by ID",
    description="Get detailed information about a specific vehicle"
)
async def get_vehicle_endpoint(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get vehicle details by ID"""
    try:
        vehicle = await get_vehicle_by_id(db, vehicle_id)

        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {vehicle_id} not found"
            )

        return {
            "id": vehicle.id,
            "registrationNumber": vehicle.registrationNumber,
            "name": vehicle.name,
            "type": vehicle.type.value,
            "seatingCapacity": vehicle.seatingCapacity,
            "isAvailable": vehicle.isAvailable,
            "pricePerKm": float(vehicle.pricePerKm),
            "pricePerDay": float(vehicle.pricePerDay) if hasattr(vehicle, 'pricePerDay') and vehicle.pricePerDay else float(vehicle.pricePerKm) * 200,
            "minimumCharge": float(vehicle.minimumCharge),
            "driverAllowancePerDay": float(vehicle.driverAllowancePerDay),
            "minimumDays": vehicle.minimumDays,
            "make": vehicle.make,
            "model": vehicle.model,
            "year": vehicle.year,
            "fuelType": vehicle.fuelType,
            "color": vehicle.color,
            "amenities": vehicle.amenities or [],
            "images": vehicle.images or [],
            "thumbnailImage": vehicle.thumbnailImage,
            "description": vehicle.description,
            "features": vehicle.features,  # JSON string
            "rating": float(vehicle.rating) if vehicle.rating else 0,
            "reviewCount": vehicle.reviewCount,
            "lastServiceDate": vehicle.lastServiceDate.isoformat() if vehicle.lastServiceDate else None,
            "nextServiceDue": vehicle.nextServiceDue.isoformat() if vehicle.nextServiceDue else None,
            "insuranceExpiry": vehicle.insuranceExpiry.isoformat() if vehicle.insuranceExpiry else None,
            "pollutionCertExpiry": vehicle.pollutionCertExpiry.isoformat() if vehicle.pollutionCertExpiry else None,
            "fitnessCertExpiry": vehicle.fitnessCertExpiry.isoformat() if vehicle.fitnessCertExpiry else None,
            "createdAt": vehicle.createdAt.isoformat() if vehicle.createdAt else None,
            "updatedAt": vehicle.updatedAt.isoformat() if vehicle.updatedAt else None,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicle: {str(e)}"
        )


@router.post(
    "/{vehicle_id}/check-availability",
    response_model=dict,
    summary="Check vehicle availability",
    description="Check if a specific vehicle is available for dates"
)
async def check_vehicle_availability_endpoint(
    vehicle_id: str,
    request: VehicleAvailabilityRequest,
    db: AsyncSession = Depends(get_db)
):
    """Check availability for a specific vehicle"""
    try:
        from app.db.crud import check_vehicle_availability

        # Verify vehicle exists
        vehicle = await get_vehicle_by_id(db, vehicle_id)
        if not vehicle:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Vehicle with ID {vehicle_id} not found"
            )

        if not vehicle.is_available:
            return {
                "vehicle_id": vehicle_id,
                "is_available": False,
                "available_dates": [],
                "blocked_dates": []
            }

        # Check for conflicting bookings
        is_available = await check_vehicle_availability(
            db=db,
            vehicle_id=vehicle_id,
            start_date=request.start_date,
            end_date=request.end_date
        )

        # For detailed availability, we'd need to query VehicleAvailability table
        # For now, return simple response
        return {
            "vehicle_id": vehicle_id,
            "is_available": is_available,
            "available_dates": [] if not is_available else [{
                "start": request.start_date.isoformat(),
                "end": request.end_date.isoformat()
            }],
            "blocked_dates": []
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking availability: {str(e)}"
        )
