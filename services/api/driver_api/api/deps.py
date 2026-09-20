"""Shared FastAPI dependencies: JWT auth + role guards + profile loaders."""

from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from driver_api.core.db import get_db
from driver_api.core.security import decode_token
from driver_api.models import Customer, Driver, Role, User
from driver_api.utils.errors import AppError

bearer_scheme = HTTPBearer(auto_error=False)

DbDep = Annotated[AsyncSession, Depends(get_db)]


@dataclass
class CurrentUser:
    user: User
    customer: Customer | None = None
    driver: Driver | None = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if credentials is None:
        raise AppError.unauthorized("Missing Authorization header")
    try:
        payload = decode_token(credentials.credentials)
        user_id = uuid.UUID(str(payload["sub"]))
    except Exception:
        raise AppError.unauthorized("Invalid or expired token")

    user = await db.get(User, user_id)
    if user is None:
        raise AppError.unauthorized("User no longer exists")
    return CurrentUser(user=user)


async def require_customer(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if current.user.role is not Role.CUSTOMER:
        raise AppError.forbidden("Customer access required")
    current.customer = (
        await db.execute(
            select(Customer)
            .where(Customer.user_id == current.user.id)
            .options(selectinload(Customer.user))
        )
    ).scalar_one_or_none()
    if current.customer is None:
        raise AppError.unauthorized("Customer profile missing")
    return current


async def require_driver(
    current: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    if current.user.role is not Role.DRIVER:
        raise AppError.forbidden("Driver access required")
    current.driver = (
        await db.execute(
            select(Driver)
            .where(Driver.user_id == current.user.id)
            .options(selectinload(Driver.user))
        )
    ).scalar_one_or_none()
    if current.driver is None:
        raise AppError.unauthorized("Driver profile missing")
    return current


async def require_admin(
    current: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    if current.user.role is not Role.ADMIN:
        raise AppError.forbidden("Admin access required")
    return current
