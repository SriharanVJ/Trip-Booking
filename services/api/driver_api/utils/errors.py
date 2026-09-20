from __future__ import annotations


class AppError(Exception):
    """Operational error mapped to a clean JSON response by the handler in
    main.py: {"error": {"code": ..., "message": ...}}."""

    def __init__(self, status_code: int, message: str, code: str = "API_ERROR") -> None:
        self.status_code = status_code
        self.message = message
        self.code = code
        super().__init__(message)

    @classmethod
    def bad_request(cls, message: str, code: str = "BAD_REQUEST") -> "AppError":
        return cls(400, message, code)

    @classmethod
    def unauthorized(cls, message: str = "Unauthorized") -> "AppError":
        return cls(401, message, "UNAUTHORIZED")

    @classmethod
    def forbidden(cls, message: str = "Forbidden") -> "AppError":
        return cls(403, message, "FORBIDDEN")

    @classmethod
    def not_found(cls, message: str = "Not found") -> "AppError":
        return cls(404, message, "NOT_FOUND")

    @classmethod
    def conflict(cls, message: str) -> "AppError":
        return cls(409, message, "CONFLICT")

    @classmethod
    def too_many_requests(cls, message: str = "Too many requests") -> "AppError":
        return cls(429, message, "TOO_MANY_REQUESTS")
