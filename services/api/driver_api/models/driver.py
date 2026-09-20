import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from driver_api.core.db import Base
from driver_api.models.user import CreatedBy, User


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class Driver(Base):
    __tablename__ = "drivers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    license_no: Mapped[str | None] = mapped_column(String(64))
    license_doc_url: Mapped[str | None] = mapped_column(String(500))
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus, name="verification_status", values_callable=lambda e: [m.value for m in e]),
        default=VerificationStatus.PENDING,
        nullable=False,
    )
    is_online: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    current_lat: Mapped[float | None] = mapped_column(Float)
    current_lng: Mapped[float | None] = mapped_column(Float)
    rating_avg: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0, nullable=False)
    total_trips: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Driver reliability tracking — future penalty logic (spec 4.2)
    cancellation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # self_signup (OTP flow) or admin (created directly by an admin)
    created_by: Mapped[CreatedBy] = mapped_column(
        Enum(CreatedBy, name="created_by", values_callable=lambda e: [m.value for m in e]),
        default=CreatedBy.SELF_SIGNUP,
        server_default=CreatedBy.SELF_SIGNUP.value,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped[User] = relationship(back_populates="driver")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="driver")  # noqa: F821
