"""Email helpers shared by the OTP flow, profiles and admin onboarding.

Emails are stored lowercased so uniqueness behaves the way users expect
(`Ravi@Gmail.com` and `ravi@gmail.com` are the same inbox).
"""

from __future__ import annotations

import re

_PLACEHOLDER_DOMAIN = "@phone.placeholder"


def normalize_email(email: str) -> str:
    """Strip + lowercase. Format validation happens in the schemas (EmailStr)."""
    return email.strip().lower()


def placeholder_email(phone: str) -> str:
    """Deterministic per-phone stand-in for accounts onboarded without an
    email (legacy rows, admin-created accounts). Mirrored by the Alembic
    backfill — keep the two in sync."""
    return f"{phone.lstrip('+')}{_PLACEHOLDER_DOMAIN}"


def is_placeholder_email(email: str | None) -> bool:
    return bool(email) and email.endswith(_PLACEHOLDER_DOMAIN)
