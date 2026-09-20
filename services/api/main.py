"""Unified FastAPI entrypoint.

Serves both modules from one process:
  - **Book Travels**    → travels_api, mounted at /api/v1 (vehicles, bookings, auth…)
  - **Acting Driver**   → driver_api,  mounted at /api    (OTP auth, matching, drivers)
  - WebSockets          → /ws/{role}/{user_id}
  - Driver uploads      → /uploads (static)

Configuration comes from the single .env at the repo root. travels_api reads
DATABASE_URL/SECRET_KEY; driver_api reads DRIVER_DATABASE_URL/JWT_SECRET (the
DRIVER_ prefix exists because both modules previously claimed DATABASE_URL).
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from driver_api.api.routes import admin, auth, customer, driver
from driver_api.core.config import settings as driver_settings
from driver_api.core.db import AsyncSessionLocal, engine as driver_engine
from driver_api.core.redis import redis_service
from driver_api.services.driver_service import rewarm_geo_index
from driver_api.services.matching_service import matching_service
from driver_api.sockets.routes import router as ws_router
from driver_api.utils.errors import AppError

from travels_api.api.v1.api import api_router as travels_api_router
from travels_api.core.config import settings as travels_settings
from travels_api.db.base import Base
from travels_api.db.session import engine as travels_engine

logging.basicConfig(
    level=logging.INFO if not driver_settings.is_prod else logging.WARNING,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def _otp_provider_label() -> str:
    if driver_settings.otp_provider == "twilio_verify":
        return f"twilio_verify (Verify Service: {driver_settings.twilio_verify_service_sid})"
    if driver_settings.otp_provider == "email":
        return f"email (SMTP: {driver_settings.smtp_host}:{driver_settings.smtp_port})"
    return "mock"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Book Travels: create any missing tables (schema-as-code) ----------
    async with travels_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # --- Acting Driver boot recovery ---------------------------------------
    # The geo index and per-booking search loops are in-process, so a restart
    # orphans both — DB keeps is_online=true for drivers whose panel hasn't
    # reconnected (or isn't open), and `searching` bookings are left with no
    # loop at all.
    logger.info("Acting Driver module (kv backend: %s, distance: %s)",
                redis_service.backend, driver_settings.distance_provider)
    logger.info("OTP provider: %s", _otp_provider_label())
    async with AsyncSessionLocal() as db:
        online = await rewarm_geo_index(db)
    if online:
        logger.info("Re-warmed matching geo index with %d online driver(s)", online)
    resumed = await matching_service.resume_orphaned_searches()
    if resumed:
        logger.info("Resumed matching for %d searching booking(s)", resumed)

    yield

    await redis_service.close()
    await driver_engine.dispose()
    await travels_engine.dispose()


def _cors_origins() -> list[str]:
    """Union of both modules' allow-lists, de-duplicated, order-stable."""
    merged: list[str] = []
    for origin in [*travels_settings.BACKEND_CORS_ORIGINS, *driver_settings.cors_origin_list]:
        if origin not in merged:
            merged.append(origin)
    return merged


app = FastAPI(
    title="Book Travels + Acting Driver API",
    description=(
        "Unified backend for two booking modules.\n\n"
        "**Book Travels** (`travels_api`): vehicle rental booking — "
        "`/api/v1/vehicles`, `/api/v1/bookings`, `/api/v1/auth`.\n\n"
        "**Acting Driver** (`driver_api`): book a driver to drive your own "
        "vehicle — `POST /api/auth/send-otp` (phone **and** email) → "
        "`POST /api/auth/verify-otp` → JWT in `Authorization: Bearer <token>`.\n\n"
        "**WebSockets**: `/ws/driver/{user_id}?token=<jwt>` and "
        "`/ws/customer/{user_id}?token=<jwt>`."
    ),
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------- exceptions
# Handlers below come from the Acting Driver module. Payloads deliberately keep
# FastAPI's native `detail` field alongside the `error` object so the Book
# Travels frontend (which reads `response.data.detail`) is unaffected.


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "error": {"code": exc.code, "message": exc.message},
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    # exc.errors() can carry raw exception objects in `ctx` (e.g. ValueError from
    # a field validator) which aren't JSON serializable — keep only plain data.
    details = [{k: v for k, v in err.items() if k != "ctx"} for err in exc.errors()]
    return JSONResponse(
        status_code=422,
        content={
            "detail": details,
            "error": {"code": "validation_error", "message": "Invalid request payload",
                      "details": details},
        },
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error": {"code": "internal_error", "message": "Something went wrong"},
        },
    )


# ------------------------------------------------------------------- routes

# Book Travels — /api/v1/*
app.include_router(travels_api_router, prefix=travels_settings.API_V1_PREFIX)

# Acting Driver — /api/*  (routers carry their own /api/... prefixes)
app.include_router(auth.router)
app.include_router(customer.router)
app.include_router(driver.router)
app.include_router(admin.router)

# Acting Driver realtime — /ws/{role}/{user_id}
app.include_router(ws_router)

uploads_path = Path(driver_settings.upload_dir)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")


@app.get("/", tags=["System"], summary="API overview")
async def root():
    return {
        "message": "Book Travels + Acting Driver API",
        "modules": {
            "travels": {"prefix": travels_settings.API_V1_PREFIX, "name": travels_settings.PROJECT_NAME},
            "driver": {"prefix": "/api", "name": driver_settings.app_name},
        },
        "docs": "/docs",
    }


@app.get("/health", tags=["System"], summary="Health check")
async def health():
    return {
        "status": "ok",
        "environment": driver_settings.environment,
        "modules": {
            "travels": "ok",
            "driver": "ok",
        },
        "kv_backend": redis_service.backend,
        "distance_provider": driver_settings.distance_provider,
        "otp_provider": driver_settings.otp_provider,
    }
