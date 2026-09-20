import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from driver_api.core.db import Base


class Role(str, enum.Enum):
    CUSTOMER = "customer"
    DRIVER = "driver"
    ADMIN = "admin"


class CreatedBy(str, enum.Enum):
    """How the account was onboarded (audit trail for admin-created accounts)."""

    SELF_SIGNUP = "self_signup"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    # Login/OTP identity channel — phone stays as the contact number for the
    # driver-calls-customer flow. `*@phone.placeholder` marks legacy rows that
    # existed before email was collected; the address is captured on their
    # next OTP request.
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120))
    role: Mapped[Role] = mapped_column(
        Enum(Role, name="user_role", values_callable=lambda e: [m.value for m in e]),
        default=Role.CUSTOMER,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    driver: Mapped["Driver | None"] = relationship(back_populates="user", uselist=False)  # noqa: F821
    customer: Mapped["Customer | None"] = relationship(back_populates="user", uselist=False)  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<User {self.phone} ({self.role.value})>"
