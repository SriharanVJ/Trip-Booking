"""SQLAlchemy models. Import this package so Base.metadata is complete
(Alembic autogenerate + create_all rely on it)."""

from driver_api.models.booking import Booking, BookingStatus, BookingStatusLog, BookingType, CancelledBy, PaymentStatus
from driver_api.models.driver import Driver, VerificationStatus
from driver_api.models.customer import Customer
from driver_api.models.pricing_config import PricingConfig
from driver_api.models.rating import Rating
from driver_api.models.user import CreatedBy, Role, User

__all__ = [
    "Booking",
    "BookingStatus",
    "BookingStatusLog",
    "BookingType",
    "CancelledBy",
    "CreatedBy",
    "Customer",
    "Driver",
    "PaymentStatus",
    "PricingConfig",
    "Rating",
    "Role",
    "User",
    "VerificationStatus",
]
