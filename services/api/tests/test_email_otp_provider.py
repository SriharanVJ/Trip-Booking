"""EmailOTPProvider contract (spec 4.1): SMTP delivery shape and failure
mapping. `smtplib.SMTP` is mocked — no test touches a network."""

import smtplib
from unittest.mock import patch

import pytest

from driver_api.services.otp_providers.email_otp_provider import EmailOTPProvider
from driver_api.utils.errors import AppError

_TARGET = "app.services.otp_providers.email_otp_provider.smtplib.SMTP"


def make_provider() -> EmailOTPProvider:
    return EmailOTPProvider(
        smtp_host="smtp.test",
        smtp_port=587,
        smtp_user="otp@test",
        smtp_password="app-password",
        from_address="no-reply@actingdriver.test",
    )


class TestEmailOTPProvider:
    def test_owns_no_code_lifecycle(self):
        # Code generation/storage/verification stays in otp_service
        # (mock-style); this class is only the delivery hop.
        provider = make_provider()
        assert provider.owns_code_lifecycle is False
        assert provider.channel == "email"

    def test_send_uses_starttls_login_and_sendmail(self):
        provider = make_provider()
        with patch(_TARGET) as smtp_cls:
            provider.send("driver@example.com", "4321")

        smtp_cls.assert_called_once_with("smtp.test", 587)
        server = smtp_cls.return_value.__enter__.return_value
        server.starttls.assert_called_once()
        server.login.assert_called_once_with("otp@test", "app-password")

        from_addr, to_addrs, body = server.sendmail.call_args[0]
        assert from_addr == "no-reply@actingdriver.test"
        assert to_addrs == ["driver@example.com"]
        assert "Your Acting Driver verification code" in body
        assert "4321" in body
        assert "This code expires in 5 minutes." in body

    def test_bad_credentials_map_to_misconfigured_503(self):
        provider = make_provider()
        with patch(_TARGET) as smtp_cls:
            server = smtp_cls.return_value.__enter__.return_value
            server.login.side_effect = smtplib.SMTPAuthenticationError(535, b"Bad credentials")
            with pytest.raises(AppError) as exc:
                provider.send("driver@example.com", "4321")

        assert exc.value.status_code == 503
        assert exc.value.code == "EMAIL_SEND_FAILED"
        assert "misconfigured" in exc.value.message

    @pytest.mark.parametrize("error", [
        smtplib.SMTPException("connection died"),
        ConnectionRefusedError(),
        TimeoutError(),
    ])
    def test_transport_failures_map_to_retryable_503(self, error):
        provider = make_provider()
        with patch(_TARGET) as smtp_cls:
            server = smtp_cls.return_value.__enter__.return_value
            server.sendmail.side_effect = error
            with pytest.raises(AppError) as exc:
                provider.send("driver@example.com", "4321")

        assert exc.value.status_code == 503
        assert exc.value.code == "EMAIL_SEND_FAILED"
        assert "try again" in exc.value.message.lower()
