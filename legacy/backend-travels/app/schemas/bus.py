"""Vehicle booking schemas for trip booking"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class TripEstimate(BaseModel):
    """Trip cost and time estimate"""
    from_loc: str
    to: str
    passengers: int
    estimatedDistanceKm: float
    estimatedDurationHours: float
    estimatedPrice: float

    class Config:
        json_schema_extra = {
            "example": {
                "from_loc": "Chennai",
                "to": "Bangalore",
                "passengers": 5,
                "estimatedDistanceKm": 346,
                "estimatedDurationHours": 6,
                "estimatedPrice": 4500
            }
        }


class VehicleResponse(BaseModel):
    """Vehicle response schema"""
    id: str
    registrationNumber: str
    name: str
    type: str
    seatingCapacity: int
    isAvailable: bool
    pricePerKm: float
    minimumCharge: float
    driverAllowancePerDay: float
    minimumDays: int
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuelType: Optional[str] = None
    color: Optional[str] = None
    amenities: List[str] = []
    images: List[str] = []
    thumbnailImage: Optional[str] = None
    description: Optional[str] = None
    rating: float = 0
    reviewCount: int = 0
    createdAt: Optional[str] = None
    tripEstimate: Optional[TripEstimate] = None


class VehicleSuggestion(BaseModel):
    """Suggested vehicle for passenger count"""
    type: str
    name: str
    capacity: int
    description: str
    estimatedPrice: float


class RouteResponse(BaseModel):
    """Route response schema"""
    id: str
    origin: str
    destination: str
    distance: int
    duration: int
    popular: bool


# Legacy aliases for compatibility
BusResponse = VehicleResponse
BusSearchResult = VehicleResponse
BusSearchParams = VehicleSuggestion
