"""Login/signup (phone+OTP), admin bootstrap login, JWT issuance."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.core.config import settings
from driver_api.core.security import constant_time_equals, create_access_token
from driver_api.models import Customer, Driver, Role, User
from driver_api.utils.errors import AppError


async def ensure_email_available(db: AsyncSession, *, email: str, phone: str | None = None) -> None:
    """409 if `email` is already on an account (optionally excluding `phone`).

    Emails are normalized (stripped + lowercased) before storage, so the
    unique index behaves the way users expect.
    """
    stmt = select(User.id).where(User.email == email)
    if phone is not None:
        stmt = stmt.where(User.phone != phone)
    if (await db.execute(stmt)).scalar_one_or_none() is not None:
        raise AppError.conflict("This email is already associated with another account.")


async def get_or_create_user(db: AsyncSession, phone: str, role: Role,
                             email: str | None = None) -> tuple[User, bool]:
    """Returns (user, created). New customer/driver users get a profile row.

    `email` is the address resolved at send-otp time; it's only used when the
    user row is created (existing accounts keep their stored email).
    """
    user = (
        await db.execute(select(User).where(User.phone == phone))
    ).scalar_one_or_none()
    if user is not None:
        return user, False

    if email is None:
        # Can only happen if the pending-email KV entry expired between a
        # successful OTP verify and user creation — effectively the same as
        # the session expiring.
        raise AppError.bad_request("Signup session expired. Please request a new OTP.")

    user = User(phone=phone, email=email, role=role)
    db.add(user)
    await db.flush()
    if role is Role.CUSTOMER:
        db.add(Customer(user_id=user.id))
    elif role is Role.DRIVER:
        db.add(Driver(user_id=user.id))
    await db.flush()
    return user, True


async def login_with_otp(db: AsyncSession, phone: str, role: Role,
                         email: str | None = None) -> tuple[User, bool, str]:
    """OTP is verified by the caller. Returns (user, created, token)."""
    user, created = await get_or_create_user(db, phone, role, email=email)
    if user.role is not role:
        # Accounts are one-role-per-phone: handing back a customer token to the
        # driver app would just 403 on every call — fail loudly instead.
        raise AppError.forbidden(
            f"This phone number is registered as a {user.role.value} account. "
            f"Please log in from the {user.role.value} app."
        )
    token = create_access_token(user_id=user.id, role=user.role, phone=user.phone)
    return user, created, token


async def admin_login(db: AsyncSession, phone: str, password: str) -> tuple[User, str]:
    """Admins are bootstrapped from env (no password column in `users`)."""
    if not (
        constant_time_equals(phone, settings.admin_phone)
        and constant_time_equals(password, settings.admin_password)
    ):
        raise AppError.unauthorized("Invalid admin credentials")

    admin = (
        await db.execute(
            select(User).where(User.phone == settings.admin_phone, User.role == Role.ADMIN)
        )
    ).scalar_one_or_none()
    if admin is None:
        admin = User(phone=settings.admin_phone, email=settings.admin_email,
                     role=Role.ADMIN, name="Admin")
        db.add(admin)
        await db.flush()

    token = create_access_token(user_id=admin.id, role=Role.ADMIN, phone=admin.phone)
    return admin, token


def user_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "phone": user.phone,
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "created_at": user.created_at.isoformat() if user.created_at else None,
        "is_new_user": False,
    }
