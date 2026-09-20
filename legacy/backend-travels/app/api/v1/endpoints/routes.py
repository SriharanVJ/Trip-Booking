"""Routes and featured destinations endpoints"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from random import sample

from app.db.session import get_db
from app.db.crud import get_vehicles

router = APIRouter()


# Featured route destinations with pricing
FEATURED_ROUTES = [
    {
        "id": "1",
        "origin": "Tirupur",
        "destination": "Ooty",
        "description": "Scenic hill station journey through Nilgiri mountains",
        "from": 4999,
    },
    {
        "id": "2",
        "origin": "Tirupur",
        "destination": "Kodaikanal",
        "description": "Beautiful journey to the Princess of Hill Stations",
        "from": 5999,
    },
    {
        "id": "3",
        "origin": "Tirupur",
        "destination": "Rameshwaram",
        "description": "Spiritual journey to the sacred island",
        "from": 9999,
    },
    {
        "id": "4",
        "origin": "Tirupur",
        "destination": "Valparai",
        "description": "Tea gardens and misty mountains adventure",
        "from": 5999,
    },
    {
        "id": "5",
        "origin": "Chennai",
        "destination": "Pondicherry",
        "description": "Coastal journey to the French colonial town",
        "from": 3999,
    },
    {
        "id": "6",
        "origin": "Bangalore",
        "destination": "Mysore",
        "description": "Royal heritage tour through Karnataka",
        "from": 4499,
    },
]


@router.get(
    "/featured",
    response_model=List[Dict[str, Any]],
    summary="Get featured routes",
    description="Get popular travel routes with sample vehicles and pricing"
)
async def get_featured_routes(db: AsyncSession = Depends(get_db)):
    """Get featured routes with vehicle images and availability"""

    # Get a few sample vehicles to display with routes
    vehicles = await get_vehicles(db=db, skip=0, limit=10, available_only=True)

    # Shuffle vehicles to get variety
    if len(vehicles) > 4:
        sampled_vehicles = sample(vehicles, min(4, len(vehicles)))
    else:
        sampled_vehicles = vehicles

    # Map vehicles to routes
    result = []
    for i, route in enumerate(FEATURED_ROUTES[:4]):
        vehicle = sampled_vehicles[i] if i < len(sampled_vehicles) else None

        result.append({
            "id": route["id"],
            "origin": route["origin"],
            "destination": route["destination"],
            "description": route["description"],
            "from": route["from"],
            "image": vehicle.thumbnailImage if vehicle else None,
            "vehicleType": vehicle.type.value if vehicle else None,
            "seatingCapacity": vehicle.seatingCapacity if vehicle else None,
        })

    return result


@router.get(
    "/destinations",
    response_model=List[str],
    summary="Get available destinations",
    description="Get list of popular destination cities"
)
async def get_destinations():
    """Get list of available destinations"""
    destinations = [
        "Ooty",
        "Kodaikanal",
        "Rameshwaram",
        "Valparai",
        "Munnar",
        "Pondicherry",
        "Mysore",
        "Coorg",
        "Wayanad",
        "Chikmagalur",
    ]
    return destinations
