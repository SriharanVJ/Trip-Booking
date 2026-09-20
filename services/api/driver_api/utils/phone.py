"""Phone normalization — store one canonical format per user."""

from __future__ import annotations

import re

_DIGITS = re.compile(r"\D+")


def normalize_phone(raw: str) -> str:
    """'098765 43210' → '+919876543210'; '9876543210' → '+919876543210'.

    10-digit numbers are treated as Indian; numbers already carrying a country
    code keep it. Punctuation/spaces are always stripped so every spelling of
    the same number lands on one canonical value (uniqueness checks rely on it).
    """
    phone = (raw or "").strip()
    if not phone:
        raise ValueError("Phone number is required")
    digits = _DIGITS.sub("", phone)
    if not phone.startswith("+"):
        if len(digits) == 11 and digits.startswith("0"):
            digits = digits[1:]  # Indian trunk prefix
        return f"+91{digits}" if len(digits) == 10 else f"+{digits}"
    return f"+{digits}"
