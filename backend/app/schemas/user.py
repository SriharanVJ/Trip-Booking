"""User/Customer schemas for request/response validation"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerBase(BaseModel):
    """Base customer schema"""
    first_name: str
    last_name: str
    email: EmailStr
    phone: str


class CustomerCreate(CustomerBase):
    """Customer creation schema"""
    password: str
    is_corporate: Optional[bool] = False


class CustomerLogin(BaseModel):
    """Customer login schema"""
    email: EmailStr
    password: str


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: str
    is_verified: bool
    is_corporate: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminLogin(BaseModel):
    """Admin login schema"""
    email: EmailStr
    password: str


class AdminResponse(BaseModel):
    """Admin response schema"""
    id: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    token_type: str = "bearer"
    user_type: Optional[str] = "customer"  # customer or admin


class TokenPayload(BaseModel):
    """Token payload schema"""
    sub: str  # user_id
    user_type: Optional[str] = "customer"
    exp: Optional[int] = None
