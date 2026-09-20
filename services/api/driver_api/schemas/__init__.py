"""Pydantic request/response models."""

from driver_api.schemas.admin import (
    AdminCreateCustomerIn,
    AdminCreateDriverIn,
    AdminLoginIn,
    UpdatePricingIn,
    VerifyDriverIn,
)
from driver_api.schemas.auth import SendOTPIn, VerifyOTPIn
from driver_api.schemas.booking import CreateBookingIn, RateBookingIn
from driver_api.schemas.driver import LocationIn, OnlineStatusIn, UpdateDriverProfileIn
from driver_api.schemas.profile import UpdateCustomerProfileIn

__all__ = [
    "AdminCreateCustomerIn",
    "AdminCreateDriverIn",
    "AdminLoginIn",
    "CreateBookingIn",
    "LocationIn",
    "OnlineStatusIn",
    "RateBookingIn",
    "SendOTPIn",
    "UpdateCustomerProfileIn",
    "UpdateDriverProfileIn",
    "UpdatePricingIn",
    "VerifyDriverIn",
    "VerifyOTPIn",
]
