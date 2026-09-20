"""Admin operations: driver verification, booking lists, pricing config, dues,
plus direct driver/customer account creation."""

from __future__ import annotations

import uuid

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from driver_api.core.redis import DRIVERS_GEO_KEY, redis_service
from driver_api.models import Booking, CreatedBy, Customer, Driver, Role, User, VerificationStatus
from driver_api.services import pricing_service
from driver_api.services.auth_service import ensure_email_available
from driver_api.services.driver_service import serialize_driver
from driver_api.services.queries import BOOKING_LOAD_OPTIONS
from driver_api.utils.email import normalize_email, placeholder_email
from driver_api.utils.errors import AppError
from driver_api.utils.serializers import serialize_booking


async def list_drivers(db: AsyncSession,
                       verification_status: VerificationStatus | None = None) -> list[dict]:
    stmt = (select(Driver)
            .options(selectinload(Driver.user))
            .order_by(Driver.created_at.desc()))
    if verification_status is not None:
        stmt = stmt.where(Driver.verification_status == verification_status)
    rows = (await db.execute(stmt)).scalars().all()
    return [serialize_driver(d) for d in rows]


async def create_driver(db: AsyncSession, *, phone: str, name: str, license_no: str,
                        license_doc_url: str | None, pre_verified: bool,
                        email: str | None = None) -> dict:
    """Admin directly onboards a driver — no OTP needed (admin vouches for the
    phone). The driver logs in later via the normal OTP flow."""
    existing = (await db.execute(select(User.id).where(User.phone == phone))).scalar_one_or_none()
    if existing is not None:
        raise AppError.conflict("A user with this phone number already exists.")
    if email is not None:
        email = normalize_email(email)
        await ensure_email_available(db, email=email, phone=phone)
    else:
        # NOT NULL column — placeholder until the driver's first OTP login.
        email = placeholder_email(phone)

    if pre_verified:
        # Admin verified the license in person — skip the review queue.
        verification = VerificationStatus.APPROVED
        is_verified = True
    else:
        # Same starting state as self-signup: driver uploads docs later and
        # goes through the normal approval queue.
        verification = VerificationStatus.PENDING
        is_verified = False

    try:
        user = User(phone=phone, email=email, name=name, role=Role.DRIVER)
        db.add(user)
        await db.flush()
        driver = Driver(
            user_id=user.id,
            license_no=license_no,
            license_doc_url=license_doc_url,
            is_verified=is_verified,
            verification_status=verification,
            created_by=CreatedBy.ADMIN,
        )
        db.add(driver)
        await db.commit()
    except IntegrityError:
        # Lost a race against a concurrent signup with the same phone or email
        # — the unique constraints turned it into a 409, not a 500.
        await db.rollback()
        raise AppError.conflict("A user with this phone number or email already exists.")

    driver = (await db.execute(
        select(Driver).where(Driver.id == driver.id).options(selectinload(Driver.user))
    )).scalar_one()
    return serialize_driver(driver)


async def set_verification(db: AsyncSession, driver_id: uuid.UUID, approve: bool) -> dict:
    driver = (await db.execute(
        select(Driver).where(Driver.id == driver_id).options(selectinload(Driver.user))
    )).scalar_one_or_none()
    if driver is None:
        raise AppError.not_found("Driver not found")

    if approve:
        driver.is_verified = True
        driver.verification_status = VerificationStatus.APPROVED
    else:
        driver.is_verified = False
        driver.verification_status = VerificationStatus.REJECTED
        driver.is_online = False
        # Rejected drivers leave the matching pool immediately
        await redis_service.geo.zrem(DRIVERS_GEO_KEY, str(driver.user_id))
    await db.commit()
    return serialize_driver(driver)


async def list_bookings(db: AsyncSession, *, status=None,
                        limit: int = 50, offset: int = 0) -> list[dict]:
    stmt = (select(Booking).options(*BOOKING_LOAD_OPTIONS)
            .order_by(Booking.requested_at.desc())
            .limit(limit).offset(offset))
    if status is not None:
        stmt = stmt.where(Booking.status == status)
    rows = (await db.execute(stmt)).scalars().all()
    return [serialize_booking(b, viewer="admin", reveal=True) for b in rows]


def serialize_customer(customer: Customer, user: User) -> dict:
    return {
        "customer_id": str(customer.id),
        "user_id": str(user.id),
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "pending_dues": float(customer.pending_dues or 0),
        "created_by": customer.created_by.value,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
    }


async def create_customer(db: AsyncSession, *, phone: str, name: str,
                          email: str | None = None) -> dict:
    """Admin directly onboards a customer — no OTP needed; they log in later
    via the normal OTP flow."""
    existing = (await db.execute(select(User.id).where(User.phone == phone))).scalar_one_or_none()
    if existing is not None:
        raise AppError.conflict("A user with this phone number already exists.")
    if email is not None:
        email = normalize_email(email)
        await ensure_email_available(db, email=email, phone=phone)
    else:
        email = placeholder_email(phone)

    try:
        user = User(phone=phone, email=email, name=name, role=Role.CUSTOMER)
        db.add(user)
        await db.flush()
        customer = Customer(user_id=user.id, created_by=CreatedBy.ADMIN)
        db.add(customer)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise AppError.conflict("A user with this phone number or email already exists.")

    customer = (await db.execute(
        select(Customer).where(Customer.id == customer.id).options(selectinload(Customer.user))
    )).scalar_one()
    return serialize_customer(customer, customer.user)


async def list_customers(db: AsyncSession, *, search: str | None = None,
                         created_by: CreatedBy | None = None,
                         limit: int = 50, offset: int = 0) -> tuple[list[dict], int]:
    """All customers (newest first), with phone/name search and an optional
    created_by filter. Returns (page rows, total matching)."""
    stmt = select(Customer, User).join(User, Customer.user_id == User.id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(User.phone.ilike(like) | User.name.ilike(like) | User.email.ilike(like))
    if created_by is not None:
        stmt = stmt.where(Customer.created_by == created_by)

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    rows = (await db.execute(
        stmt.order_by(Customer.created_at.desc()).limit(limit).offset(offset)
    )).all()
    return [serialize_customer(customer, user) for customer, user in rows], total


async def list_customers_with_dues(db: AsyncSession) -> list[dict]:
    rows = (await db.execute(
        select(Customer, User)
        .join(User, Customer.user_id == User.id)
        .where(Customer.pending_dues > 0)
        .order_by(Customer.pending_dues.desc())
    )).all()
    return [
        {
            "customer_id": str(customer.id),
            "name": user.name,
            "phone": user.phone,
            "email": user.email,
            "pending_dues": float(customer.pending_dues),
        }
        for customer, user in rows
    ]


async def clear_dues(db: AsyncSession, customer_id: uuid.UUID) -> dict:
    customer = await db.get(Customer, customer_id)
    if customer is None:
        raise AppError.not_found("Customer not found")
    cleared = float(customer.pending_dues or 0)
    customer.pending_dues = 0
    await db.commit()
    return {"customer_id": str(customer_id), "cleared_amount": cleared, "pending_dues": 0.0}


async def get_pricing_config(db: AsyncSession) -> dict:
    config = await pricing_service.get_pricing(db)
    return {
        "per_km_rate": float(config.per_km_rate),
        "per_hour_rate": float(config.per_hour_rate),
        "pickup_free_km_limit": float(config.pickup_free_km_limit),
        "pickup_charge_per_km": float(config.pickup_charge_per_km),
        "cancellation_fee_percent": float(config.cancellation_fee_percent),
        "matching_radius_km": float(config.matching_radius_km),
        "block_booking_if_dues_exceed": config.block_booking_if_dues_exceed,
        "updated_at": config.updated_at.isoformat() if config.updated_at else None,
    }
