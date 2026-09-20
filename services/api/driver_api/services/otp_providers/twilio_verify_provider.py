"""Twilio Verify SMS provider (spec 5.1).

Twilio Verify generates, delivers and validates the code itself, so unlike the
mock provider there is no local code storage — `send` starts a verification and
`check` asks Twilio whether the entered code is `approved`. The sync Twilio SDK
is wrapped in `asyncio.to_thread` by `otp_service`, so these methods stay
plainly blocking.

The POC runs on a trial account: only numbers verified as Caller IDs in the
Twilio console can receive codes — everything else maps to `PHONE_NOT_VERIFIED`.
"""

from __future__ import annotations

import logging

from twilio.base.exceptions import TwilioException, TwilioRestException
from twilio.rest import Client

from driver_api.utils.errors import AppError

logger = logging.getLogger(__name__)

# Twilio error code for "number is not a Verified Caller ID" (trial accounts).
_UNVERIFIED_NUMBER_CODE = 21608
# Twilio error code for hitting Verify's own send-attempt rate limit.
_TWILIO_SEND_LIMIT_CODE = 60203

_PHONE_NOT_VERIFIED_MESSAGE = (
    "This number can't receive OTPs yet in this test environment. "
    "Contact support to get it added."
)


class TwilioVerifyProvider:
    """Real SMS OTPs via Twilio Verify. Raises AppError on Twilio failures."""

    # Tells OTPService that this provider generates/validates codes itself —
    # no local code storage or echo, and verify goes through `check`.
    owns_code_lifecycle = True

    def __init__(self, account_sid: str, auth_token: str, verify_service_sid: str):
        self.client = Client(account_sid, auth_token)
        self.service_sid = verify_service_sid

    def send(self, phone: str) -> None:
        """Start an SMS verification (Twilio creates and sends the code)."""
        try:
            self.client.verify.v2.services(self.service_sid).verifications.create(
                to=phone, channel="sms"
            )
        except TwilioRestException as exc:
            raise self._translate(exc) from exc
        except (TwilioException, ConnectionError, OSError) as exc:
            raise self._service_unavailable(exc) from exc

    def check(self, phone: str, code: str) -> bool:
        """True only when Twilio says the code is approved."""
        try:
            result = self.client.verify.v2.services(
                self.service_sid
            ).verification_checks.create(to=phone, code=code)
        except TwilioRestException as exc:
            raise self._translate(exc) from exc
        except (TwilioException, ConnectionError, OSError) as exc:
            raise self._service_unavailable(exc) from exc
        return result.status == "approved"

    # ── Twilio exceptions → app errors ────────────────────────────────────────

    @staticmethod
    def _translate(exc: TwilioRestException) -> AppError:
        msg = (exc.msg or "").strip()
        logger.warning("Twilio Verify error: status=%s code=%s msg=%s",
                       exc.status, getattr(exc, "code", None), msg)
        if exc.status == 429 or getattr(exc, "code", None) == _TWILIO_SEND_LIMIT_CODE:
            return AppError.too_many_requests(
                "Too many OTP attempts. Please wait a few minutes and try again."
            )
        # Trial accounts only deliver to Verified Caller IDs.
        if (getattr(exc, "code", None) == _UNVERIFIED_NUMBER_CODE
                or "unverified" in msg.lower()
                or "not a verified" in msg.lower()):
            return AppError.bad_request(_PHONE_NOT_VERIFIED_MESSAGE,
                                        code="PHONE_NOT_VERIFIED")
        if exc.status and 400 <= exc.status < 500:
            # Bad request from us (bad phone format, expired service…):
            # surface Twilio's own words rather than a scary 5xx.
            return AppError.bad_request(
                msg or "OTP provider rejected the request.", code="OTP_PROVIDER_ERROR"
            )
        return AppError(
            503, "SMS provider is unavailable right now. Please try again shortly.",
            code="SMS_PROVIDER_UNAVAILABLE",
        )

    @staticmethod
    def _service_unavailable(exc: Exception) -> AppError:
        logger.warning("Twilio Verify unreachable: %s", exc)
        return AppError(
            503, "SMS provider is unavailable right now. Please try again shortly.",
            code="SMS_PROVIDER_UNAVAILABLE",
        )
