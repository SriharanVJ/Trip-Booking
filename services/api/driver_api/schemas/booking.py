from pydantic import BaseModel, Field, model_validator

from driver_api.models import BookingType


class CreateBookingIn(BaseModel):
    """Flat payload (matches the frontend's booking form).

    location  → drop_* required, hours must be absent
    hourly    → hours required (1–24), drop_* must be absent (spec 6)
    """

    type: BookingType
    pickup_lat: float = Field(ge=-90, le=90)
    pickup_lng: float = Field(ge=-180, le=180)
    pickup_address_text: str = Field(min_length=1, max_length=500)
    drop_lat: float | None = Field(None, ge=-90, le=90)
    drop_lng: float | None = Field(None, ge=-180, le=180)
    drop_address_text: str | None = Field(None, max_length=500)
    hours: int | None = Field(None, ge=1, le=24)

    @model_validator(mode="after")
    def check_type_fields(self) -> "CreateBookingIn":
        if self.type is BookingType.LOCATION:
            if self.drop_lat is None or self.drop_lng is None or not self.drop_address_text:
                raise ValueError("drop_lat, drop_lng and drop_address_text are required for location bookings")
            if self.hours is not None:
                raise ValueError("hours must not be set for location bookings")
        else:  # hourly
            if self.hours is None:
                raise ValueError("hours is required for hourly bookings")
            if self.drop_lat is not None or self.drop_lng is not None or self.drop_address_text:
                raise ValueError("drop location must not be set for hourly bookings")
        return self


class RateBookingIn(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = Field(None, max_length=1000)
