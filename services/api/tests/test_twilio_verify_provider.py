"""Twilio Verify provider and the otp_service twilio path, with the Twilio SDK
fully mocked (no network, no real SMS).

Two layers are covered:
- `TwilioVerifyProvider` — correct Verify API calls, `check` only true for
  "approved", Twilio failures mapped to app errors (429 / PHONE_NOT_VERIFIED /
  400 / 503).
- `OTPService` with a twilio-shaped provider — no `otp` in the response,
  10-minute validity, wrong-attempt cap and send rate limit still enforced.
"""

from __future__ import annotations

import asyncio
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from twilio.base.exceptions import TwilioRestException

from driver_api.core.config import settings
from driver_api.core.redis import RedisService
from driver_api.services.otp_providers.twilio_verify_provider import (
    _PHONE_NOT_VERIFIED_MESSAGE,
    TwilioVerifyProvider,
)
from driver_api.services.otp_service import TWILIO_VERIFY_TTL_SECONDS, OTPService
from driver_api.utils.errors import AppError

SID_ARGS = ("ACtest-sid", "authtoken", "VAtest-service")


def _mocked_client(approved_status: str | None = None,
                   create_side_effect: Exception | None = None) -> MagicMock:
    """A fake twilio.rest.Client with the verifications/verification_checks
    chains wired to one of: return a status, or raise."""
    client = MagicMock()
    checks_create = client.verify.v2.services.return_value.verification_checks.create
    verifications_create = client.verify.v2.services.return_value.verifications.create
    if approved_status is not None:
        checks_create.return_value = SimpleNamespace(status=approved_status)
    if create_side_effect is not None:
        checks_create.side_effect = create_side_effect
        verifications_create.side_effect = create_side_effect
    return client


def _provider_with(client: MagicMock) -> TwilioVerifyProvider:
    with patch("app.services.otp_providers.twilio_verify_provider.Client",
               return_value=client):
        return TwilioVerifyProvider(*SID_ARGS)


class TestTwilioVerifyProvider:
    def test_send_calls_verifications_create_with_sms_channel(self):
        client = _mocked_client()
        with patch("app.services.otp_providers.twilio_verify_provider.Client") as ctor:
            ctor.return_value = client
            provider = TwilioVerifyProvider(*SID_ARGS)

        provider.send("+919876543210")

        ctor.assert_called_once_with("ACtest-sid", "authtoken")
        client.verify.v2.services.assert_called_once_with("VAtest-service")
        client.verify.v2.services.return_value.verifications.create \
            .assert_called_once_with(to="+919876543210", channel="sms")

    def test_check_approved_returns_true(self):
        provider = _provider_with(_mocked_client(approved_status="approved"))
        assert provider.check("+919876543210", "1234") is True

    @pytest.mark.parametrize("status", ["pending", "canceled", "denied"])
    def test_check_non_approved_returns_false(self, status):
        provider = _provider_with(_mocked_client(approved_status=status))
        assert provider.check("+919876543210", "1234") is False

    def test_provider_owns_code_lifecycle(self):
        assert _provider_with(MagicMock()).owns_code_lifecycle is True

    # ── Twilio failure → app error mapping ────────────────────────────────

    def test_twilio_rate_limit_maps_to_429(self):
        exc = TwilioRestException(429, "https://verify.twilio.com", msg="Max send attempts",
                                  code=60203)
        provider = _provider_with(_mocked_client(create_side_effect=exc))
        with pytest.raises(AppError) as err:
            provider.send("+919876543210")
        assert err.value.status_code == 429

    def test_unverified_trial_number_maps_to_phone_not_verified(self):
        exc = TwilioRestException(400, "uri", msg="Phone number is not verified",
                                  code=21608)
        provider = _provider_with(_mocked_client(create_side_effect=exc))
        with pytest.raises(AppError) as err:
            provider.send("+919876543210")
        assert err.value.status_code == 400
        assert err.value.code == "PHONE_NOT_VERIFIED"
        assert err.value.message == _PHONE_NOT_VERIFIED_MESSAGE

    def test_check_rest_exception_re_raised_as_app_error(self):
        exc = TwilioRestException(404, "uri", msg="Verification not found", code=20404)
        provider = _provider_with(_mocked_client(create_side_effect=exc))
        with pytest.raises(AppError) as err:
            provider.check("+919876543210", "1234")
        assert err.value.status_code == 400
        assert err.value.code == "OTP_PROVIDER_ERROR"
        assert "Verification not found" in err.value.message

    def test_network_failure_maps_to_503(self):
        provider = _provider_with(_mocked_client(create_side_effect=ConnectionError("boom")))
        with pytest.raises(AppError) as err:
            provider.send("+919876543210")
        assert err.value.status_code == 503
        assert err.value.code == "SMS_PROVIDER_UNAVAILABLE"


class _FakeTwilioProvider:
    """Twilio-shaped stand-in at the service layer: sync methods, owns the
    code lifecycle, check() only approves one code."""

    owns_code_lifecycle = True

    def __init__(self, approved_code: str = "9999"):
        self.approved_code = approved_code
        self.sent: list[str] = []

    def send(self, phone: str) -> None:
        self.sent.append(phone)

    def check(self, phone: str, code: str) -> bool:
        return code == self.approved_code


class TestOTPServiceTwilioPath:
    def make_service(self):
        provider = _FakeTwilioProvider()
        return OTPService(kv=RedisService().kv, sms=provider), provider

    def test_send_response_has_no_otp_and_ten_minute_validity(self):
        service, provider = self.make_service()

        response = asyncio.run(service.send_otp("+919876543210"))

        assert response["expires_in_seconds"] == TWILIO_VERIFY_TTL_SECONDS == 600
        assert "otp" not in response
        assert provider.sent == ["+919876543210"]

    def test_verify_with_twilio_approved_code_passes(self):
        service, _ = self.make_service()
        asyncio.run(service.send_otp("+919876543210"))

        asyncio.run(service.verify_otp("+919876543210", "9999"))  # no exception

    def test_wrong_code_raises_400(self):
        service, _ = self.make_service()
        asyncio.run(service.send_otp("+919876543210"))

        with pytest.raises(AppError) as err:
            asyncio.run(service.verify_otp("+919876543210", "0000"))
        assert err.value.status_code == 400

    def test_wrong_attempt_cap_reused(self):
        service, _ = self.make_service()
        asyncio.run(service.send_otp("+919876543210"))
        for _ in range(5):
            with pytest.raises(AppError):
                asyncio.run(service.verify_otp("+919876543210", "0000"))

        with pytest.raises(AppError) as err:
            asyncio.run(service.verify_otp("+919876543210", "9999"))
        assert err.value.status_code == 429
        assert "Too many wrong attempts" in err.value.message

    def test_send_rate_limit_still_applies(self, monkeypatch):
        # conftest raises the send cap for route tests — pin it back here.
        monkeypatch.setattr(settings, "otp_send_max_per_10min", 3)
        service, _ = self.make_service()
        for _ in range(3):
            asyncio.run(service.send_otp("+919876543210"))

        with pytest.raises(AppError) as err:
            asyncio.run(service.send_otp("+919876543210"))
        assert err.value.status_code == 429
