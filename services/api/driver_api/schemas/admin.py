import re
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from driver_api.utils.phone import normalize_phone


class AdminLoginIn(BaseModel):
    phone: str = Field(min_length=4, max_length=25)
    password: str = Field(min_length=4, max_length=128)


class _AdminCreateBase(BaseModel):
    """Shared phone handling for admin-created accounts: normalized exactly
    like the OTP flow, with a floor on digit count so garbage input is a 422."""

    phone: str = Field(min_length=4, max_length=25)

    @field_validator("phone")
    @classmethod
    def _normalize(cls, v: str) -> str:
        phone = normalize_phone(v)  # raises ValueError on empty → 422
        if len(re.sub(r"\D", "", phone[1:])) < 10:
            raise ValueError("Enter a valid phone number")
        return phone


class AdminCreateDriverIn(_AdminCreateBase):
    name: str = Field(min_length=1, max_length=120)
    license_no: str = Field(min_length=1, max_length=64)
    license_doc_url: str | None = Field(None, max_length=500)
    pre_verified: bool
    # Optional — without it the account gets a placeholder until the driver's
    # first OTP login supplies a real address.
    email: EmailStr | None = None


class AdminCreateCustomerIn(_AdminCreateBase):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None  # same placeholder fallback as drivers


class VerifyDriverIn(BaseModel):
    action: Literal["approve", "reject"]


class UpdatePricingIn(BaseModel):
    """All fields optional — only provided keys are updated."""

    per_km_rate: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)
    per_hour_rate: Decimal | None = Field(None, gt=0, max_digits=10, decimal_places=2)
    pickup_free_km_limit: Decimal | None = Field(None, ge=0, max_digits=6, decimal_places=2)
    pickup_charge_per_km: Decimal | None = Field(None, ge=0, max_digits=10, decimal_places=2)
    cancellation_fee_percent: Decimal | None = Field(None, ge=0, le=100, max_digits=5, decimal_places=2)
    matching_radius_km: Decimal | None = Field(None, gt=0, max_digits=6, decimal_places=2)
    block_booking_if_dues_exceed: bool | None = None
