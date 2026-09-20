from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from driver_api.utils.phone import normalize_phone


class SendOTPIn(BaseModel):
    phone: str = Field(min_length=8, max_length=25)
    # Required on every call — for existing accounts the stored email wins
    # (see routes/auth.py); for signups this is where the OTP is delivered.
    email: EmailStr

    @property
    def normalized(self) -> str:
        return normalize_phone(self.phone)


class VerifyOTPIn(BaseModel):
    phone: str = Field(min_length=8, max_length=25)
    otp: str = Field(min_length=3, max_length=8, pattern=r"^\d+$")
    role: Literal["customer", "driver"] = "customer"

    @property
    def normalized(self) -> str:
        return normalize_phone(self.phone)
