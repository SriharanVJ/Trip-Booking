"""SMTP email provider for OTP delivery (spec 4.1).

Unlike Twilio Verify, email has no managed code service — the code is
generated/stored/validated by `otp_service` exactly like the mock provider;
this class is only the delivery hop (`send(to_email, code)`).

NOTE: the SMTP call is synchronous (fine for POC volume) and runs via
`asyncio.to_thread` so it doesn't block the event loop. Before any real
scale this should move to a background task (FastAPI BackgroundTasks or
Celery) so a slow SMTP server can't stall requests.
"""

from __future__ import annotations

import logging
import smtplib
from email.mime.text import MIMEText

from driver_api.utils.errors import AppError

logger = logging.getLogger(__name__)


class EmailOTPProvider:
    """Sends OTP codes by email over generic SMTP (Gmail, Brevo, Resend…)."""

    # Local code lifecycle — same generate/store/verify logic as the mock
    # provider; email is only the delivery channel.
    owns_code_lifecycle = False
    channel = "email"

    def __init__(self, smtp_host: str, smtp_port: int, smtp_user: str,
                 smtp_password: str, from_address: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.smtp_user = smtp_user
        self.smtp_password = smtp_password
        self.from_address = from_address

    def send(self, to_email: str, code: str) -> None:
        subject = "Your Acting Driver verification code"
        body = f"Your verification code is: {code}\n\nThis code expires in 5 minutes."
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = self.from_address
        msg["To"] = to_email

        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_address, [to_email], msg.as_string())
        except smtplib.SMTPAuthenticationError as exc:
            logger.warning("SMTP auth failed for %s — check SMTP_USER/SMTP_PASSWORD", self.smtp_user)
            raise AppError(
                503, "Email service is misconfigured. Please try again later.",
                code="EMAIL_SEND_FAILED",
            ) from exc
        except (smtplib.SMTPException, ConnectionError, OSError, TimeoutError) as exc:
            logger.warning("Couldn't send OTP email to %s: %s", to_email, exc)
            raise AppError(
                503, "Couldn't send the verification email. Please try again.",
                code="EMAIL_SEND_FAILED",
            ) from exc
