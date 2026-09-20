"""Idempotent seed: pricing_config row (id=1) + admin user from env.

Run:  .venv/bin/python -m app.seed
"""

from __future__ import annotations

import asyncio

from sqlalchemy import select

from driver_api.core.config import settings
from driver_api.core.db import AsyncSessionLocal, engine
from driver_api.models import PricingConfig, Role, User
from driver_api.services.pricing_service import DEFAULTS
from driver_api.utils.email import is_placeholder_email


async def seed() -> None:
    async with AsyncSessionLocal() as db:
        if await db.get(PricingConfig, 1) is None:
            db.add(PricingConfig(**DEFAULTS))
            print("seed: created pricing_config (id=1)")
        else:
            print("seed: pricing_config already present")

        admin = (
            await db.execute(
                select(User).where(User.phone == settings.admin_phone,
                                   User.role == Role.ADMIN)
            )
        ).scalar_one_or_none()
        if admin is None:
            db.add(User(phone=settings.admin_phone, email=settings.admin_email,
                        role=Role.ADMIN, name="Admin"))
            print(f"seed: created admin user {settings.admin_phone}")
        elif is_placeholder_email(admin.email):
            # Row predates the email column — give it the configured address.
            admin.email = settings.admin_email
            print(f"seed: set admin email to {settings.admin_email}")
        else:
            print("seed: admin already present")

        await db.commit()
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
