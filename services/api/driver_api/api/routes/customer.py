import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.api.deps import CurrentUser, require_customer
from driver_api.core.db import get_db
from driver_api.models import BookingStatus, BookingType
from driver_api.schemas import CreateBookingIn, RateBookingIn, UpdateCustomerProfileIn
from driver_api.services import auth_service, booking_service
from driver_api.services.cancellation_service import CancelParty
from driver_api.services.queries import get_booking
from driver_api.utils.email import normalize_email
from driver_api.utils.errors import AppError

router = APIRouter(prefix="/api", tags=["Customer"])

CustomerDep = Depends(require_customer)


@router.get("/customer/profile", summary="My profile")
async def get_profile(me: CurrentUser = CustomerDep):
    customer = me.customer
    return {
        "user_id": str(me.user.id),
        "phone": me.user.phone,
        "email": me.user.email,
        "name": me.user.name,
        "pending_dues": float(customer.pending_dues or 0),
        "member_since": customer.created_at.isoformat() if customer.created_at else None,
    }


@router.put("/customer/profile", summary="Update my profile")
async def update_profile(payload: UpdateCustomerProfileIn, me: CurrentUser = CustomerDep,
                         db: AsyncSession = Depends(get_db)):
    me.user.name = payload.name
    if payload.email is not None:
        email = normalize_email(payload.email)
        await auth_service.ensure_email_available(db, email=email, phone=me.user.phone)
        me.user.email = email
    await db.commit()
    return {
        "user_id": str(me.user.id),
        "phone": me.user.phone,
        "email": me.user.email,
        "name": me.user.name,
        "pending_dues": float(me.customer.pending_dues or 0),
    }


@router.post("/bookings", summary="Create a booking (starts driver matching)")
async def create_booking(payload: CreateBookingIn, me: CurrentUser = CustomerDep,
                         db: AsyncSession = Depends(get_db)):
    return await booking_service.create_booking(db, me.customer, payload)


# NOTE: declared before /bookings/{booking_id} so "fare-estimate" is not
# captured as a booking id. Query params instead of a body — it's a GET and
# no booking exists yet (spec 5, pre-booking estimate).
@router.get("/bookings/fare-estimate",
            summary="Pre-booking fare estimate (no booking created)")
async def fare_estimate(
    me: CurrentUser = CustomerDep,
    db: AsyncSession = Depends(get_db),
    type: BookingType = Query(..., description="location or hourly"),
    pickup_lat: float = Query(..., ge=-90, le=90),
    pickup_lng: float = Query(..., ge=-180, le=180),
    drop_lat: float | None = Query(None, ge=-90, le=90),
    drop_lng: float | None = Query(None, ge=-180, le=180),
    hours: int | None = Query(None, ge=1, le=24),
):
    data = CreateBookingIn(
        type=type,
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        pickup_address_text="estimate",
        drop_lat=drop_lat,
        drop_lng=drop_lng,
        drop_address_text="estimate" if drop_lat is not None else None,
        hours=hours,
    )
    return await booking_service.get_fare_estimate(db, data)


@router.get("/bookings/{booking_id}", summary="Booking detail (with status audit trail)")
async def get_booking_detail(booking_id: uuid.UUID, me: CurrentUser = CustomerDep,
                             db: AsyncSession = Depends(get_db)):
    return await booking_service.get_booking_detail(
        db, booking_id, viewer_role="customer", customer=me.customer
    )


@router.post("/bookings/{booking_id}/cancel",
             summary="Cancel a booking (fee rules per spec 4.2)")
async def cancel_booking(booking_id: uuid.UUID, me: CurrentUser = CustomerDep,
                         db: AsyncSession = Depends(get_db)):
    booking = await get_booking(db, booking_id)
    if booking is None or booking.customer_id != me.customer.id:
        raise AppError.not_found("Booking not found")
    return await booking_service.cancel_booking(db, booking, cancelled_by=CancelParty.CUSTOMER)


@router.post("/bookings/{booking_id}/rate", summary="Rate a completed trip")
async def rate_booking(booking_id: uuid.UUID, payload: RateBookingIn,
                       me: CurrentUser = CustomerDep,
                       db: AsyncSession = Depends(get_db)):
    return await booking_service.rate_booking(
        db, me.customer, booking_id, payload.rating, payload.review_text
    )


@router.get("/customer/bookings", summary="My booking history")
async def my_bookings(status: BookingStatus | None = Query(None),
                      me: CurrentUser = CustomerDep,
                      db: AsyncSession = Depends(get_db)):
    bookings = await booking_service.list_customer_bookings(db, me.customer, status)
    return {"bookings": bookings, "count": len(bookings)}


@router.get("/customer/dues", summary="My pending cancellation fees")
async def my_dues(me: CurrentUser = CustomerDep):
    dues = float(me.customer.pending_dues or 0)
    return {"pending_dues": dues, "has_dues": dues > 0}
