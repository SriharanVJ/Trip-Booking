import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from driver_api.core.db import Base
from driver_api.models.user import CreatedBy, User


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False
    )
    # Running balance of unpaid cancellation fees
    pending_dues: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
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

    user: Mapped[User] = relationship(back_populates="customer")
    bookings: Mapped[list["Booking"]] = relationship(back_populates="customer")  # noqa: F821
