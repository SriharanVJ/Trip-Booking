import uuid

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from driver_api.api.deps import CurrentUser, require_driver
from driver_api.core.config import settings
from driver_api.core.db import get_db
from driver_api.models import BookingStatus
from driver_api.schemas import LocationIn, OnlineStatusIn, UpdateDriverProfileIn
from driver_api.services import booking_service, driver_service
from driver_api.utils.errors import AppError

router = APIRouter(prefix="/api", tags=["Driver"])

DriverDep = Depends(require_driver)


@router.get("/driver/profile", summary="My driver profile")
async def get_profile(me: CurrentUser = DriverDep):
    return driver_service.serialize_driver(me.driver)


@router.put("/driver/profile", summary="Update name / license number / email")
async def update_profile(payload: UpdateDriverProfileIn, me: CurrentUser = DriverDep,
                         db: AsyncSession = Depends(get_db)):
    return await driver_service.update_profile(
        db, me.driver, name=payload.name, license_no=payload.license_no,
        email=payload.email,
    )


@router.post("/driver/documents", summary="Upload license document (resets verification to pending)")
async def upload_documents(file: UploadFile, me: CurrentUser = DriverDep,
                           db: AsyncSession = Depends(get_db)):
    content = await file.read()
    if len(content) > settings.max_upload_mb * 1024 * 1024:
        raise AppError.bad_request(f"File exceeds the {settings.max_upload_mb} MB limit")
    return await driver_service.upload_document(
        db, me.driver, file.filename or "license", content
    )


@router.patch("/driver/online-status", summary="Go online / offline (adds/removes from matching pool)")
async def set_online_status(payload: OnlineStatusIn, me: CurrentUser = DriverDep,
                            db: AsyncSession = Depends(get_db)):
    return await driver_service.set_online_status(db, me.driver, payload.is_online)


@router.patch("/driver/location", summary="Location ping (streams to customer during active trips)")
async def update_location(payload: LocationIn, me: CurrentUser = DriverDep,
                          db: AsyncSession = Depends(get_db)):
    return await driver_service.update_location(db, me.driver, payload.lat, payload.lng)


@router.post("/bookings/{booking_id}/accept",
             summary="Accept an offered booking (first driver wins; race-safe)")
async def accept_booking(booking_id: uuid.UUID, me: CurrentUser = DriverDep,
                         db: AsyncSession = Depends(get_db)):
    return await booking_service.accept_booking(db, me.driver, booking_id)


@router.post("/bookings/{booking_id}/reject",
             summary="Reject an offered booking (assigned drivers trigger a cancellation)")
async def reject_booking(booking_id: uuid.UUID, me: CurrentUser = DriverDep,
                         db: AsyncSession = Depends(get_db)):
    return await booking_service.reject_booking(db, me.driver, booking_id)


@router.post("/bookings/{booking_id}/start-trip", summary="Start the trip (after pickup)")
async def start_trip(booking_id: uuid.UUID, me: CurrentUser = DriverDep,
                     db: AsyncSession = Depends(get_db)):
    return await booking_service.start_trip(db, me.driver, booking_id)


@router.post("/bookings/{booking_id}/complete-trip", summary="Complete the trip")
async def complete_trip(booking_id: uuid.UUID, me: CurrentUser = DriverDep,
                        db: AsyncSession = Depends(get_db)):
    return await booking_service.complete_trip(db, me.driver, booking_id)


@router.post("/bookings/{booking_id}/mark-paid",
             summary="Mark cash/UPI payment as collected (spec 4.5)")
async def mark_paid(booking_id: uuid.UUID, me: CurrentUser = DriverDep,
                    db: AsyncSession = Depends(get_db)):
    return await booking_service.mark_payment_collected(db, me.driver, booking_id)


@router.get("/driver/bookings", summary="My trip history")
async def my_bookings(status: BookingStatus | None = Query(None),
                      me: CurrentUser = DriverDep,
                      db: AsyncSession = Depends(get_db)):
    bookings = await booking_service.list_driver_bookings(db, me.driver, status)
    return {"bookings": bookings, "count": len(bookings)}


@router.get("/driver/earnings", summary="Earnings summary")
async def earnings(me: CurrentUser = DriverDep, db: AsyncSession = Depends(get_db)):
    return await booking_service.driver_earnings(db, me.driver)
