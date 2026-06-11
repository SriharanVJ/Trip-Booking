"""Vehicle search endpoint for trip booking"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from app.db.session import get_db
from app.db.crud import get_vehicles, get_vehicle_by_id
from app.schemas.bus import BusResponse, RouteResponse, BusSearchResult, VehicleSuggestion
from app.db.models import VehicleType

router = APIRouter()


def get_vehicle_types_for_passengers(passenger_count: int) -> List[VehicleType]:
    """Suggest vehicle types based on passenger count"""
    suggestions = []

    if passenger_count <= 4:
        suggestions.extend([VehicleType.CAR_5_SEATER])
    if passenger_count <= 5:
        suggestions.append(VehicleType.CAR_5_SEATER)
    if passenger_count <= 7:
        suggestions.append(VehicleType.CAR_7_SEATER)
    if passenger_count <= 9:
        suggestions.append(VehicleType.CAR_9_SEATER)
    if passenger_count <= 14:
        suggestions.append(VehicleType.TRAVELLER_14_SEATER)
    if passenger_count <= 21:
        suggestions.append(VehicleType.COACH_21_SEATER)
    if passenger_count <= 24:
        suggestions.append(VehicleType.COACH_24_SEATER)
    if passenger_count <= 52:
        suggestions.append(VehicleType.BUS_52_SEATER)

    # If more than 52, only suggest the largest
    if passenger_count > 52:
        suggestions = [VehicleType.BUS_52_SEATER]

    return list(set(suggestions))  # Remove duplicates


def vehicle_to_dict(vehicle) -> dict:
    """Convert Vehicle model to dict"""
    return {
        "id": vehicle.id,
        "registrationNumber": vehicle.registration_number,
        "name": vehicle.name,
        "type": vehicle.type.value,
        "seatingCapacity": vehicle.seating_capacity,
        "isAvailable": vehicle.is_available,
        "pricePerKm": float(vehicle.price_per_km),
        "minimumCharge": float(vehicle.minimum_charge),
        "driverAllowancePerDay": float(vehicle.driver_allowance_per_day),
        "minimumDays": vehicle.minimum_days,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "fuelType": vehicle.fuel_type,
        "color": vehicle.color,
        "amenities": vehicle.amenities or [],
        "images": vehicle.images or [],
        "thumbnailImage": vehicle.thumbnail_image,
        "description": vehicle.description,
        "rating": float(vehicle.rating) if vehicle.rating else 0,
        "reviewCount": vehicle.review_count,
        "createdAt": vehicle.created_at.isoformat() if vehicle.created_at else None,
    }


@router.get("/search")
async def search_vehicles(
    origin: str = Query(..., description="Pickup location"),
    destination: str = Query(..., description="Drop location"),
    passengers: int = Query(..., ge=1, le=52, description="Number of passengers"),
    date: str = Query(..., description="Travel date (ISO format)"),
    db: AsyncSession = Depends(get_db)
):
    """Search available vehicles for trip

    Returns vehicles that can accommodate the passenger count
    """
    # Get appropriate vehicle types for passenger count
    suggested_types = get_vehicle_types_for_passengers(passengers)

    # Get available vehicles of suggested types
    all_vehicles = []
    for vehicle_type in suggested_types:
        vehicles = await get_vehicles(
            db,
            skip=0,
            limit=100,
            vehicle_type=vehicle_type,
            available_only=True
        )
        all_vehicles.extend(vehicles)

    # Format results
    results = []
    for vehicle in all_vehicles:
        vehicle_dict = vehicle_to_dict(vehicle)
        # Add trip estimation
        estimated_distance = 100  # Placeholder - would use distance API
        estimated_duration_hours = estimated_distance / 50  # Rough estimate

        vehicle_dict.update({
            "tripEstimate": {
                "from_loc": origin,
                "to": destination,
                "passengers": passengers,
                "estimatedDistanceKm": estimated_distance,
                "estimatedDurationHours": estimated_duration_hours,
                "estimatedPrice": float(vehicle.price_per_km) * estimated_distance + float(vehicle.minimum_charge),
            }
        })
        results.append(vehicle_dict)

    return results


@router.get("/vehicle-types")
async def get_vehicle_types():
    """Get all available vehicle types with descriptions"""
    return {
        "vehicleTypes": [
            {
                "type": "CAR_5_SEATER",
                "name": "5 Seater Car",
                "capacity": 5,
                "description": "Sedan or Hatchback - Perfect for small groups and city trips",
                "typicalUse": "City tours, airport transfers, outstation trips",
            },
            {
                "type": "CAR_7_SEATER",
                "name": "7 Seater SUV",
                "capacity": 7,
                "description": "SUV or MPV - Comfortable for families",
                "typicalUse": "Family trips, weekend getaways",
            },
            {
                "type": "CAR_9_SEATER",
                "name": "9 Seater Van",
                "capacity": 9,
                "description": "Large van - Spacious for groups",
                "typicalUse": "Corporate events, group tours",
            },
            {
                "type": "TRAVELLER_14_SEATER",
                "name": "14 Seater Tempo Traveller",
                "capacity": 14,
                "description": "Tempo Traveller - Popular for group travel",
                "typicalUse": "Corporate outings, family reunions, pilgrimage",
            },
            {
                "type": "COACH_21_SEATER",
                "name": "21 Seater Mini Coach",
                "capacity": 21,
                "description": "Mini Coach - Comfortable seating",
                "typicalUse": "School trips, corporate events",
            },
            {
                "type": "COACH_24_SEATER",
                "name": "24 Seater Coach",
                "capacity": 24,
                "description": "Spacious Coach - Extra legroom",
                "typicalUse": "Long distance travel, tours",
            },
            {
                "type": "BUS_52_SEATER",
                "name": "52 Seater Bus",
                "capacity": 52,
                "description": "Full-size Bus - Large groups",
                "typicalUse": "Corporate events, weddings, large group tours",
            },
        ]
    }


@router.get("/routes", response_model=List[RouteResponse])
async def get_popular_routes(
    popular: bool = None,
    db: AsyncSession = Depends(get_db)
):
    """Get popular routes (mock data)"""
    routes = [
        {
            "id": "RT-CHN-BLR",
            "origin": "Chennai",
            "destination": "Bangalore",
            "distance": 346,
            "duration": 6,
            "popular": True,
        },
        {
            "id": "RT-BLR-HYD",
            "origin": "Bangalore",
            "destination": "Hyderabad",
            "distance": 575,
            "duration": 10,
            "popular": True,
        },
        {
            "id": "RT-CHN-MUM",
            "origin": "Chennai",
            "destination": "Mumbai",
            "distance": 1330,
            "duration": 24,
            "popular": False,
        },
        {
            "id": "RT-DEL-AGRA",
            "origin": "Delhi",
            "destination": "Agra",
            "distance": 230,
            "duration": 4,
            "popular": True,
        },
    ]

    if popular is not None:
        routes = [r for r in routes if r["popular"] == popular]

    return routes


@router.get("/{vehicle_id}")
async def get_vehicle_details(
    vehicle_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get vehicle details by ID"""
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle_to_dict(vehicle)
