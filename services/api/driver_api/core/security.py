import hmac
from datetime import datetime, timedelta, timezone

import jwt

from driver_api.core.config import settings


def create_access_token(user_id: str, role: str, phone: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "phone": phone,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expires_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Raises jwt.InvalidTokenError / jwt.ExpiredSignatureError on failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def constant_time_equals(a: str, b: str) -> bool:
    return hmac.compare_digest(str(a).encode(), str(b).encode())
