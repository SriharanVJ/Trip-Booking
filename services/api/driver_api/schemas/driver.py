from pydantic import BaseModel, EmailStr, Field


class UpdateDriverProfileIn(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    license_no: str | None = Field(None, min_length=1, max_length=64)
    email: EmailStr | None = None  # optional update; uniqueness checked in the service


class OnlineStatusIn(BaseModel):
    is_online: bool


class LocationIn(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
