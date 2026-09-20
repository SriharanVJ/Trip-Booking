"""Application configuration settings"""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

# Single .env at the repo root is shared by both modules (driver_api reads the
# same file). Resolved from this file's location so it works from any CWD.
# core/ → travels_api → api → services → repo root
_REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    """Application settings"""

    model_config = SettingsConfigDict(
        env_file=str(_REPO_ROOT / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        # The shared .env also carries driver_api's variables — ignore them.
        extra="ignore",
    )

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Book Travels"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://54.79.186.207:3000",
        "http://54.79.186.207:3001",
    ]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True


settings = Settings()
