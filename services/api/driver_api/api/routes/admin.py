import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.api.deps import CurrentUser, require_admin
from driver_api.core.db import get_db
from driver_api.models import BookingStatus, CreatedBy, VerificationStatus
from driver_api.schemas import (
    AdminCreateCustomerIn,
    AdminCreateDriverIn,
    AdminLoginIn,
    UpdatePricingIn,
    VerifyDriverIn,
)
from driver_api.services import admin_service, auth_service
from driver_api.services import pricing_service

router = APIRouter(prefix="/api/admin", tags=["Admin"])

AdminDep = Depends(require_admin)


@router.post("/login", summary="Admin login (env-bootstrapped credentials)")
async def login(payload: AdminLoginIn, db: AsyncSession = Depends(get_db)):
    admin, token = await auth_service.admin_login(db, payload.phone, payload.password)
    await db.commit()
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": auth_service.user_payload(admin),
    }


@router.get("/drivers", summary="List drivers (filter by verification status)")
async def list_drivers(verification_status: VerificationStatus | None = Query(None),
                       me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    drivers = await admin_service.list_drivers(db, verification_status)
    return {"drivers": drivers, "count": len(drivers)}


@router.post("/drivers", status_code=201,
             summary="Create a driver account directly (no OTP needed)")
async def create_driver(payload: AdminCreateDriverIn,
                        me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    return await admin_service.create_driver(
        db,
        phone=payload.phone,
        email=payload.email,
        name=payload.name,
        license_no=payload.license_no,
        license_doc_url=payload.license_doc_url,
        pre_verified=payload.pre_verified,
    )


@router.post("/customers", status_code=201,
             summary="Create a customer account directly (no OTP needed)")
async def create_customer(payload: AdminCreateCustomerIn,
                          me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    return await admin_service.create_customer(
        db, phone=payload.phone, email=payload.email, name=payload.name
    )


@router.get("/customers", summary="List customers (search + created_by filter, paginated)")
async def list_customers(search: str | None = Query(None, min_length=1, max_length=120),
                         created_by: CreatedBy | None = Query(None),
                         limit: int = Query(50, ge=1, le=200),
                         offset: int = Query(0, ge=0),
                         me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    customers, total = await admin_service.list_customers(
        db, search=search, created_by=created_by, limit=limit, offset=offset)
    return {"customers": customers, "count": len(customers), "total": total}


@router.patch("/drivers/{driver_id}/verify", summary="Approve or reject a driver")
async def verify_driver(driver_id: uuid.UUID, payload: VerifyDriverIn,
                        me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    return await admin_service.set_verification(db, driver_id, payload.action == "approve")


@router.get("/bookings", summary="List all bookings (filter by status)")
async def list_bookings(status: BookingStatus | None = Query(None),
                        limit: int = Query(50, ge=1, le=200),
                        offset: int = Query(0, ge=0),
                        me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    bookings = await admin_service.list_bookings(db, status=status, limit=limit, offset=offset)
    return {"bookings": bookings, "count": len(bookings)}


@router.get("/pricing-config", summary="Current pricing configuration")
async def get_pricing_config(me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    return await admin_service.get_pricing_config(db)


@router.put("/pricing-config", summary="Update pricing configuration (partial update)")
async def update_pricing_config(payload: UpdatePricingIn, me: CurrentUser = AdminDep,
                                db: AsyncSession = Depends(get_db)):
    fields = payload.model_dump(exclude_unset=True)
    if fields:
        await pricing_service.update_pricing(db, fields)
        await db.commit()
    return await admin_service.get_pricing_config(db)


@router.get("/customers/dues", summary="Customers with pending cancellation fees")
async def customers_with_dues(me: CurrentUser = AdminDep, db: AsyncSession = Depends(get_db)):
    customers = await admin_service.list_customers_with_dues(db)
    return {"customers": customers, "count": len(customers)}


@router.patch("/customers/{customer_id}/clear-dues", summary="Clear a customer's pending dues")
async def clear_dues(customer_id: uuid.UUID, me: CurrentUser = AdminDep,
                     db: AsyncSession = Depends(get_db)):
    return await admin_service.clear_dues(db, customer_id)
