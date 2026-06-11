"""API router aggregation"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, buses, bookings, admin, vehicles, availability

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(vehicles.router, prefix="/vehicles", tags=["vehicles"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(availability.router, prefix="/availability", tags=["availability"])
api_router.include_router(buses.router, prefix="/buses", tags=["buses"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
