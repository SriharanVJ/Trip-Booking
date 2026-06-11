"""Application configuration settings"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Trip Booking System"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Database
    DATABASE_URL: str
    TEST_DATABASE_URL: str = ""

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
