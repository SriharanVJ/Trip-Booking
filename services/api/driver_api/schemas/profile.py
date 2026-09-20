from pydantic import BaseModel, EmailStr, Field


class UpdateCustomerProfileIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr | None = None  # optional update; uniqueness checked in the route
