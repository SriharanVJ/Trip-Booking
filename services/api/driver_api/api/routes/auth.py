from fastapi import APIRouter
from sqlalchemy import select

from driver_api.api.deps import DbDep
from driver_api.models import Role, User
from driver_api.schemas import SendOTPIn, VerifyOTPIn
from driver_api.services import auth_service
from driver_api.services.otp_service import otp_service
from driver_api.utils.email import is_placeholder_email, normalize_email
from driver_api.utils.errors import AppError
from driver_api.utils.phone import normalize_phone

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/send-otp", summary="Send an OTP to the login email (phone identifies the account)")
async def send_otp(payload: SendOTPIn, db: DbDep):
    try:
        phone = normalize_phone(payload.phone)
    except ValueError as exc:
        raise AppError.bad_request(str(exc))
    email = normalize_email(payload.email)

    user = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()
    if user is not None:
        if is_placeholder_email(user.email):
            # Legacy/admin-created row without a real address — adopt the one
            # from this request so the account isn't locked out.
            await auth_service.ensure_email_available(db, email=email, phone=phone)
            user.email = email
            await db.commit()
        elif user.email != email:
            # The stored email wins: delivering the code elsewhere reads as
            # "the OTP never arrived". A mismatch is a typo or a client bug.
            raise AppError.conflict(
                "This phone number is registered with a different email address."
            )
    else:
        # New signup — the address must be free. (The user row itself is only
        # created after verify-otp succeeds.)
        await auth_service.ensure_email_available(db, email=email, phone=phone)

    return await otp_service.send_otp(phone, email)


@router.post("/verify-otp", summary="Verify OTP → JWT (creates the user on first login)")
async def verify_otp(payload: VerifyOTPIn, db: DbDep):
    try:
        phone = normalize_phone(payload.phone)
    except ValueError as exc:
        raise AppError.bad_request(str(exc))

    await otp_service.verify_otp(phone, payload.otp)
    # Email resolved during send-otp, parked in KV so this request shape stays
    # phone+otp+role — only consumed on the successful path.
    email = await otp_service.consume_pending_email(phone)
    user, created, token = await auth_service.login_with_otp(
        db, phone, Role(payload.role), email=email
    )
    await db.commit()

    body = auth_service.user_payload(user)
    body["is_new_user"] = created
    return {"access_token": token, "token_type": "bearer", "user": body}
