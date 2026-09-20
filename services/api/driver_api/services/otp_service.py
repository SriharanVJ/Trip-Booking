"""OTP generation/verification against the KV backend (Redis or in-memory
fallback), with rate limiting and per-phone attempt caps.

The delivery hop is pluggable (`OTP_PROVIDER`):
- `mock` (default): logs the code locally (and may echo it in dev).
- `twilio_verify`: Twilio generates/validates the code itself — nothing is
  stored or echoed locally on that path.
- `email`: code generated/stored/verified here exactly like mock, delivered
  to the login email over SMTP.

Since login/signup now collects phone AND email, the email resolved at
send-otp time is kept in the KV store (`otp:pending-email:{phone}`) so
verify-otp can create the account without the email travelling in the
verify request.
"""

from __future__ import annotations

import asyncio
import logging
import secrets
from typing import Any

from driver_api.core.config import settings
from driver_api.core.redis import RedisService, redis_service
from driver_api.utils.errors import AppError

logger = logging.getLogger(__name__)

_OTP_KEY = "otp:{phone}"
_RATE_KEY = "otp:rate:{phone}"          # sends per rolling 10-minute window
_ATTEMPT_KEY = "otp:attempts:{phone}"   # failed verify attempts per OTP
_PENDING_EMAIL_KEY = "otp:pending-email:{phone}"  # email resolved at send time

# Twilio Verify's code validity (10 min) — replaces otp_ttl_seconds on the
# twilio path, since the code's lifetime is Twilio's, not ours.
TWILIO_VERIFY_TTL_SECONDS = 600


class SMSProvider:
    """Base/mock provider — logs the message. Replace `send` for real gateways."""

    owns_code_lifecycle = False  # the code is generated/validated here
    channel = "sms"

    async def send(self, phone: str, message: str) -> None:
        # TODO: swap for Twilio/MSG91 (async httpx call) when an account exists
        logger.info("[mock-sms] to=%s body=%r", phone, message)


class OTPService:
    def __init__(self, kv: RedisService, sms: Any):
        """`sms` is SMSProvider (mock) or TwilioVerifyProvider — told apart by
        its `owns_code_lifecycle` flag (duck-typed so mock-only setups never
        import the twilio SDK)."""
        self.kv = kv
        self.sms = sms

    @staticmethod
    def _generate_code(length: int) -> str:
        return f"{secrets.randbelow(10 ** length):0{length}d}"

    async def send_otp(self, phone: str, email: str | None = None) -> dict:
        rate = await self.kv.incr(_RATE_KEY.format(phone=phone), ttl_seconds=600)
        if rate > settings.otp_send_max_per_10min:
            raise AppError.too_many_requests(
                f"Too many OTP requests. Try again in a few minutes."
            )

        # Remember the email resolved by the caller (auth route) so verify-otp
        # can create the account — the verify request carries no email.
        if email is not None:
            await self.kv.setex(
                _PENDING_EMAIL_KEY.format(phone=phone), settings.otp_ttl_seconds, email
            )

        if getattr(self.sms, "channel", "sms") == "email":
            return await self._send_via_email(phone, email)

        if getattr(self.sms, "owns_code_lifecycle", False):
            return await self._send_via_twilio(phone)

        code = self._generate_code(settings.otp_length)
        await self.kv.setex(_OTP_KEY.format(phone=phone), settings.otp_ttl_seconds, code)
        await self.kv.delete(_ATTEMPT_KEY.format(phone=phone))  # fresh OTP, fresh attempts
        await self.sms.send(phone, f"Your Acting Driver verification code is {code}")

        response: dict = {"message": "OTP sent", "expires_in_seconds": settings.otp_ttl_seconds}
        if settings.otp_echo_in_response:  # dev convenience; must be false in prod
            response["otp"] = code
        return response

    async def _send_via_email(self, phone: str, email: str | None) -> dict:
        """Mock-style code storage, delivered over SMTP instead of logged.
        Never echoed — a real delivery channel must not leak the code."""
        if email is None:
            raise AppError.bad_request("An email address is required for OTP delivery.")
        code = self._generate_code(settings.otp_length)
        await self.kv.setex(_OTP_KEY.format(phone=phone), settings.otp_ttl_seconds, code)
        await self.kv.delete(_ATTEMPT_KEY.format(phone=phone))  # fresh OTP, fresh attempts
        await asyncio.to_thread(self.sms.send, email, code)  # sync SMTP → keep the loop free
        return {"message": "OTP sent", "expires_in_seconds": settings.otp_ttl_seconds}

    async def consume_pending_email(self, phone: str) -> str | None:
        """The email resolved during send-otp (one-shot, like the code)."""
        email = await self.kv.get(_PENDING_EMAIL_KEY.format(phone=phone))
        if email is not None:
            await self.kv.delete(_PENDING_EMAIL_KEY.format(phone=phone))
        return email

    async def _send_via_twilio(self, phone: str) -> dict:
        """Twilio owns the code: it delivers it, we store nothing and never
        echo it. The app-level send rate limit above still applies."""
        await self.kv.delete(_ATTEMPT_KEY.format(phone=phone))  # fresh OTP, fresh attempts
        await asyncio.to_thread(self.sms.send, phone)  # sync SDK → keep the loop free
        return {"message": "OTP sent", "expires_in_seconds": TWILIO_VERIFY_TTL_SECONDS}

    async def verify_otp(self, phone: str, code: str) -> None:
        if getattr(self.sms, "owns_code_lifecycle", False):
            await self._verify_via_twilio(phone, code)
            return

        stored = await self.kv.get(_OTP_KEY.format(phone=phone))
        if stored is None:
            raise AppError.bad_request("OTP expired or was never sent. Request a new one.")

        attempts = await self.kv.incr(_ATTEMPT_KEY.format(phone=phone), ttl_seconds=settings.otp_ttl_seconds)
        if attempts > settings.otp_max_verify_attempts:
            await self.kv.delete(_OTP_KEY.format(phone=phone))
            raise AppError.too_many_requests("Too many wrong attempts. Request a new OTP.")

        if code != stored:
            raise AppError.bad_request("Invalid OTP.")

        await self.kv.delete(_OTP_KEY.format(phone=phone))
        await self.kv.delete(_ATTEMPT_KEY.format(phone=phone))

    async def _verify_via_twilio(self, phone: str, code: str) -> None:
        """Twilio is the validator; we only enforce the same wrong-attempt cap
        as the mock path so brute-forcing stays rate-limited at the app too."""
        attempts = await self.kv.incr(
            _ATTEMPT_KEY.format(phone=phone), ttl_seconds=TWILIO_VERIFY_TTL_SECONDS
        )
        if attempts > settings.otp_max_verify_attempts:
            raise AppError.too_many_requests("Too many wrong attempts. Request a new OTP.")

        ok = await asyncio.to_thread(self.sms.check, phone, code)
        if not ok:
            raise AppError.bad_request("Invalid OTP.")
        await self.kv.delete(_ATTEMPT_KEY.format(phone=phone))


def _build_sms_provider() -> Any:
    """Pick the delivery hop from settings — same pattern as distance_service."""
    if settings.otp_provider == "twilio_verify":
        try:
            from driver_api.services.otp_providers.twilio_verify_provider import TwilioVerifyProvider
        except ImportError as exc:
            raise RuntimeError(
                "OTP_PROVIDER=twilio_verify but the `twilio` package is missing — "
                "run `pip install -r requirements.txt`"
            ) from exc
        if settings.otp_echo_in_response:
            # Defence in depth: the twilio path never adds `otp` to a response;
            # this only tells you the flag has no effect there.
            logger.warning(
                "OTP_ECHO_IN_RESPONSE=true has no effect — the twilio_verify "
                "provider never echoes OTP codes"
            )
        return TwilioVerifyProvider(
            account_sid=settings.twilio_account_sid,
            auth_token=settings.twilio_auth_token,
            verify_service_sid=settings.twilio_verify_service_sid,
        )
    if settings.otp_provider == "email":
        from driver_api.services.otp_providers.email_otp_provider import EmailOTPProvider

        if settings.otp_echo_in_response:
            # Same rule as twilio_verify: real delivery channels never echo.
            logger.warning(
                "OTP_ECHO_IN_RESPONSE=true has no effect — the email provider "
                "never echoes OTP codes"
            )
        return EmailOTPProvider(
            smtp_host=settings.smtp_host,
            smtp_port=settings.smtp_port,
            smtp_user=settings.smtp_user,
            smtp_password=settings.smtp_password,
            from_address=settings.smtp_from_address,
        )
    return SMSProvider()


otp_service = OTPService(kv=redis_service.kv, sms=_build_sms_provider())
