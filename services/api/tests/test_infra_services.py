"""OTP flow (in-memory KV fallback), phone normalization, geo helpers,
and the mock distance provider."""

import asyncio

import pytest

from driver_api.core.config import settings
from driver_api.core.redis import RedisService
from driver_api.services.otp_service import OTPService, SMSProvider
from driver_api.utils.errors import AppError
from driver_api.utils.geo import coarsen_to_km, haversine_km
from driver_api.utils.phone import normalize_phone


class TestPhoneNormalization:
    def test_indian_10_digit_gets_country_code(self):
        assert normalize_phone("9876543210") == "+919876543210"

    def test_spaces_and_punctuation_stripped(self):
        assert normalize_phone("098765 43210") == "+919876543210"

    def test_country_code_preserved(self):
        assert normalize_phone("+14155551234") == "+14155551234"

    def test_empty_rejected(self):
        with pytest.raises(ValueError):
            normalize_phone("   ")


class TestGeoHelpers:
    def test_zero_distance(self):
        assert haversine_km(12.9716, 77.5946, 12.9716, 77.5946) == 0

    def test_chennai_to_bengaluru_roughly_290_km(self):
        d = haversine_km(13.0827, 80.2707, 12.9716, 77.5946)
        assert 260 < d < 320

    def test_coarsen_to_about_1km_grid(self):
        assert coarsen_to_km(12.971678) == 12.97


class TestDistanceProvider:
    def test_mock_applies_road_factor(self):
        from driver_api.services.distance_service import MockDistanceProvider

        provider = MockDistanceProvider(road_factor=1.3, avg_speed_kmh=25)
        straight = haversine_km(13.0827, 80.2707, 12.9716, 77.5946)
        result = asyncio.run(provider.get(13.0827, 80.2707, 12.9716, 77.5946))
        assert result.distance_km == round(straight * 1.3, 2)
        assert result.duration_min > 0


class RecordingSMS(SMSProvider):
    """Async like the real SMS hop (mock/twilio paths await send())."""

    def __init__(self, sent: list):
        self.sent = sent

    async def send(self, phone, message):
        self.sent.append((phone, message))


class RecordingEmail:
    """Sync like the real SMTP hop (otp_service runs it via to_thread)."""

    channel = "email"
    owns_code_lifecycle = False

    def __init__(self, sent: list):
        self.sent = sent

    def send(self, to_email, code):
        self.sent.append((to_email, code))


class TestOTPFlow:
    PHONE = "+919876543210"
    EMAIL = "driver@example.com"

    def make_service(self, mode: str = "mock") -> tuple[OTPService, list]:
        kv = RedisService()  # REDIS_URL unset → in-memory backend
        sent: list[tuple[str, str]] = []
        provider = RecordingEmail(sent) if mode == "email" else RecordingSMS(sent)
        return OTPService(kv=kv.kv, sms=provider), sent

    def test_send_and_verify_roundtrip(self):
        service, _ = self.make_service()
        out = asyncio.run(service.send_otp(self.PHONE))
        assert len(out["otp"]) == 4  # echo enabled in dev settings
        asyncio.run(service.verify_otp(self.PHONE, out["otp"]))  # no raise

    # --- email mode: same lifecycle, different delivery hop -----------------

    def test_email_roundtrip_delivers_code_not_the_phone(self):
        service, sent = self.make_service("email")
        out = asyncio.run(service.send_otp(self.PHONE, email=self.EMAIL))
        assert "otp" not in out  # real delivery channels never echo the code

        to_email, code = sent[0]
        assert to_email == self.EMAIL  # delivered to the email, not the phone
        assert len(code) == 4
        asyncio.run(service.verify_otp(self.PHONE, code))  # no raise

    def test_email_mode_parks_the_email_for_verify(self):
        service, _ = self.make_service("email")
        asyncio.run(service.send_otp(self.PHONE, email=self.EMAIL))
        # The auth route reads this at verify time (verify request stays phone+otp+role).
        assert asyncio.run(service.consume_pending_email(self.PHONE)) == self.EMAIL
        assert asyncio.run(service.consume_pending_email(self.PHONE)) is None  # one-shot

    def test_email_send_without_address_rejected(self):
        service, sent = self.make_service("email")
        with pytest.raises(AppError) as exc:
            asyncio.run(service.send_otp(self.PHONE))
        assert exc.value.status_code == 400
        assert sent == []

    @pytest.mark.parametrize("mode", ["mock", "email"])
    def test_wrong_otp_rejected(self, mode):
        service, _ = self.make_service(mode)
        email = self.EMAIL if mode == "email" else None
        asyncio.run(service.send_otp(self.PHONE, email=email))
        with pytest.raises(AppError) as exc:
            asyncio.run(service.verify_otp(self.PHONE, "0000"))
        assert exc.value.status_code == 400

    @pytest.mark.parametrize("mode", ["mock", "email"])
    def test_rate_limit_on_resend(self, mode, monkeypatch):
        # conftest raises the send cap for route tests (fixture phones get an
        # OTP per test) — pin the production value back for this unit test.
        monkeypatch.setattr(settings, "otp_send_max_per_10min", 3)
        service, _ = self.make_service(mode)
        email = self.EMAIL if mode == "email" else None
        for _ in range(3):
            asyncio.run(service.send_otp(self.PHONE, email=email))
        with pytest.raises(AppError) as exc:
            asyncio.run(service.send_otp(self.PHONE, email=email))
        assert exc.value.status_code == 429

    @pytest.mark.parametrize("mode", ["mock", "email"])
    def test_too_many_wrong_attempts_kills_the_otp(self, mode):
        service, _ = self.make_service(mode)
        email = self.EMAIL if mode == "email" else None
        asyncio.run(service.send_otp(self.PHONE, email=email))
        for _ in range(5):
            with pytest.raises(AppError):
                asyncio.run(service.verify_otp(self.PHONE, "0000"))
        # Even the correct code is now dead — a new OTP is required
        with pytest.raises(AppError):
            asyncio.run(service.verify_otp(self.PHONE, "1234"))

    @pytest.mark.parametrize("mode", ["mock", "email"])
    def test_verify_without_send_fails(self, mode):
        service, _ = self.make_service(mode)
        with pytest.raises(AppError) as exc:
            asyncio.run(service.verify_otp("+919000000001", "1234"))
        assert exc.value.status_code == 400
