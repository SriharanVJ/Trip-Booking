from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Single .env at the repo root is shared by both modules (travels_api reads the
# same file). Resolved from this file's location so it works from any CWD.
_REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    """All configuration via environment variables / .env (pydantic-settings)."""

    model_config = SettingsConfigDict(
        env_file=str(_REPO_ROOT / ".env"), env_file_encoding="utf-8", extra="ignore"
    )

    # App
    app_name: str = "Acting Driver API"
    environment: str = "development"  # development | production
    port: int = 8000
    cors_origins: str = "http://localhost:5173,http://localhost:8080"

    # Database (asyncpg driver; Alembic swaps to psycopg2 for sync migrations).
    # DRIVER_DATABASE_URL — the shared .env also carries travels_api's
    # DATABASE_URL (vehicle_booking), so this module namespaces its own.
    database_url: str = Field(
        default="postgresql+asyncpg://sriharan@localhost:5432/acting_driver",
        validation_alias="DRIVER_DATABASE_URL",
    )

    # Redis — empty → in-memory fallback (OTP store + rate limits + GEO index)
    redis_url: str = ""

    # Auth
    jwt_secret: str = "dev-only-insecure-secret"
    jwt_algorithm: str = "HS256"
    jwt_expires_minutes: int = 10080

    # Bootstrap admin (created by `python -m app.seed`)
    admin_phone: str = "+919999999999"
    admin_password: str = "admin123"
    admin_email: str = "admin@actingdriver.local"

    # OTP
    otp_length: int = 4
    otp_ttl_seconds: int = 300
    otp_send_max_per_10min: int = 3
    otp_max_verify_attempts: int = 5
    otp_echo_in_response: bool = True  # set false in production
    # mock = log the code (dev); twilio_verify = real SMS via Twilio Verify
    # (Twilio generates and validates the code); email = code generated/stored
    # here and delivered by SMTP. Any real channel never echoes the code.
    otp_provider: Literal["mock", "twilio_verify", "email"] = "mock"

    # Twilio Verify (only read when otp_provider == "twilio_verify")
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_verify_service_sid: str = ""

    # SMTP for OTP_PROVIDER=email — generic enough for Gmail, Brevo, Resend,
    # or any SMTP-compatible provider (config-only switch). For Gmail the
    # password is an App Password, not the account password.
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from_address: str = ""

    # Driver matching
    matching_initial_radius_km: float = 5.0
    matching_radius_step_km: float = 2.5
    matching_max_radius_km: float = 15.0
    matching_request_timeout_seconds: float = 30.0
    matching_max_attempts: int = 6
    matching_batch_size: int = 5

    # Mock distance provider
    distance_provider: str = "mock"  # mock | google-maps
    mock_road_factor: float = 1.3
    mock_avg_speed_kmh: float = 25.0

    # Uploads — anchored under services/api/uploads so it doesn't depend on CWD
    upload_dir: str = str(_REPO_ROOT / "services" / "api" / "uploads")
    max_upload_mb: int = 5

    @property
    def is_prod(self) -> bool:
        return self.environment == "production"

    @model_validator(mode="after")
    def _provider_creds_required_when_active(self) -> "Settings":
        """Fail at boot, not on the first OTP request, if the selected provider
        is missing its credentials."""
        if self.otp_provider == "twilio_verify" and not (
            self.twilio_account_sid and self.twilio_auth_token and self.twilio_verify_service_sid
        ):
            raise ValueError(
                "OTP_PROVIDER=twilio_verify requires TWILIO_ACCOUNT_SID, "
                "TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID"
            )
        if self.otp_provider == "email" and not (
            self.smtp_user and self.smtp_password and self.smtp_from_address
        ):
            raise ValueError(
                "OTP_PROVIDER=email requires SMTP_USER, SMTP_PASSWORD "
                "(Gmail: an App Password) and SMTP_FROM_ADDRESS"
            )
        return self

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        return origins or ["*"]

    @property
    def sync_database_url(self) -> str:
        """Alembic runs on a sync engine — swap the async driver out."""
        return self.database_url.replace("+asyncpg", "+psycopg2")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
