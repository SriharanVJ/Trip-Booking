"""Booking schemas for request/response validation"""

from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime


class PassengerDetails(BaseModel):
    """Passenger details schema"""
    name: str
    email: EmailStr
    phone: str
    age: Optional[int] = None
    gender: Optional[str] = None


class BookingCreate(BaseModel):
    """Booking creation schema"""
    schedule_id: str
    seats: List[int]
    travel_date: str
    passenger_details: List[PassengerDetails]


class BookingResponse(BaseModel):
    """Booking response schema"""
    id: str
    user_id: str
    schedule_id: str
    seats: List[int]
    status: str
    total_amount: float
    passenger_details: List[PassengerDetails]
    travel_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    """Booking status update schema"""
    status: str
