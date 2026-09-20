"""Pricing config access — single row (id=1), self-healing for dev."""

from __future__ import annotations

from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.models import PricingConfig

DEFAULTS: dict = {
    "id": 1,
    "per_km_rate": Decimal("15"),
    "per_hour_rate": Decimal("150"),
    "pickup_free_km_limit": Decimal("3"),
    "pickup_charge_per_km": Decimal("15"),
    "cancellation_fee_percent": Decimal("15"),
    "matching_radius_km": Decimal("5"),
    "block_booking_if_dues_exceed": False,
}


async def get_pricing(db: AsyncSession) -> PricingConfig:
    """Fetch row id=1; create it with defaults if a fresh DB skipped seeding."""
    config = await db.get(PricingConfig, 1)
    if config is None:
        config = PricingConfig(**DEFAULTS)
        db.add(config)
        await db.flush()
    return config


async def update_pricing(db: AsyncSession, fields: dict) -> PricingConfig:
    config = await get_pricing(db)
    for key, value in fields.items():
        setattr(config, key, value)
    await db.flush()
    return config
