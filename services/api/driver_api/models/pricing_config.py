import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from driver_api.core.db import Base


class PricingConfig(Base):
    """Single-row pricing configuration (id=1)."""

    __tablename__ = "pricing_config"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    per_km_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=15, nullable=False)
    per_hour_rate: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=150, nullable=False)
    pickup_free_km_limit: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=3, nullable=False)
    pickup_charge_per_km: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=15, nullable=False)
    cancellation_fee_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=15, nullable=False)
    # Matching tuning (4.3) + dues policy flag (4.5) live in the config table
    matching_radius_km: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=5, nullable=False)
    block_booking_if_dues_exceed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    # Kept for schema symmetry with other UUID tables
    _unused_uuid: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True, default=None
    )
