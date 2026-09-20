import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from driver_api.core.db import Base
from driver_api.models.customer import Customer
from driver_api.models.driver import Driver


class BookingType(str, enum.Enum):
    LOCATION = "location"
    HOURLY = "hourly"


class BookingStatus(str, enum.Enum):
    REQUESTED = "requested"
    SEARCHING = "searching"
    DRIVER_ASSIGNED = "driver_assigned"
    TRIP_STARTED = "trip_started"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class CancelledBy(str, enum.Enum):
    CUSTOMER = "customer"
    DRIVER = "driver"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COLLECTED = "collected"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False, index=True
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("drivers.id"), nullable=True, index=True
    )

    type: Mapped[BookingType] = mapped_column(
        Enum(BookingType, name="booking_type", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    pickup_lat: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_lng: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_address_text: Mapped[str] = mapped_column(String(500), nullable=False)
    drop_lat: Mapped[float | None] = mapped_column(Float)
    drop_lng: Mapped[float | None] = mapped_column(Float)
    drop_address_text: Mapped[str | None] = mapped_column(String(500))
    hours: Mapped[int | None] = mapped_column(Integer)

    trip_distance_km: Mapped[float | None] = mapped_column(Float)
    # Distance the assigned driver travelled to reach the customer
    pickup_distance_km: Mapped[float | None] = mapped_column(Float)
    pickup_charge: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    base_fare: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    total_fare: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    cancellation_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0, nullable=False)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status", values_callable=lambda e: [m.value for m in e]),
        default=BookingStatus.REQUESTED,
        nullable=False,
        index=True,
    )
    cancelled_by: Mapped[CancelledBy | None] = mapped_column(
        Enum(CancelledBy, name="cancelled_by", values_callable=lambda e: [m.value for m in e])
    )
    payment_status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus, name="payment_status", values_callable=lambda e: [m.value for m in e]),
        default=PaymentStatus.PENDING,
        nullable=False,
    )
    # Set at the moment a driver is assigned — gates customer phone exposure
    phone_revealed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    customer: Mapped[Customer] = relationship(back_populates="bookings")
    driver: Mapped[Driver | None] = relationship(back_populates="bookings")
    status_log: Mapped[list["BookingStatusLog"]] = relationship(
        back_populates="booking", order_by="BookingStatusLog.changed_at"
    )
    rating: Mapped["Rating | None"] = relationship(back_populates="booking", uselist=False)  # noqa: F821

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Booking {self.id} {self.type.value}/{self.status.value}>"


class BookingStatusLog(Base):
    """Full audit trail of status transitions."""

    __tablename__ = "booking_status_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False, index=True
    )
    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus, name="booking_status", values_callable=lambda e: [m.value for m in e]),
        nullable=False,
    )
    note: Mapped[str | None] = mapped_column(String(500))
    changed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    booking: Mapped[Booking] = relationship(back_populates="status_log")
