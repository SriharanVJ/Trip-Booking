"""Integration-test fixtures: an isolated `acting_driver_test` Postgres database.

The database is created on first use (from the same credentials as the dev DB),
tables come straight from the ORM metadata (migrations not needed for tests),
user data is truncated between tests, and the app's `get_db` dependency is
redirected to the test engine. `pricing_config` is left alone so the pricing
defaults behave like production.
"""

from __future__ import annotations

import asyncio
import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

# Hermetic tests: pin the OTP provider before the app (and its settings) are
# imported, so the suite never needs real SMTP/Twilio credentials regardless
# of the developer's .env. Echo stays on — _otp_login reads it — and the send
# rate limit is raised because fixture phones get an OTP per test.
os.environ["OTP_PROVIDER"] = "mock"
os.environ["OTP_ECHO_IN_RESPONSE"] = "true"
os.environ["OTP_SEND_MAX_PER_10MIN"] = "100"

import driver_api.models  # noqa: F401,E402 — registers every model on Base.metadata
from driver_api.core.config import settings
from driver_api.core.db import Base, get_db
from main import app

TEST_DB_NAME = "acting_driver_test"

_url = make_url(settings.database_url)


def _sync_url(database: str) -> str:
    return str(_url.set(database=database).render_as_string(hide_password=False)).replace(
        "+asyncpg", "+psycopg2"
    )


_async_test_url = _url.set(database=TEST_DB_NAME).render_as_string(hide_password=False)


@pytest.fixture(scope="session")
def _test_engine():
    admin_engine = create_engine(_sync_url("postgres"), poolclass=NullPool,
                                 isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": TEST_DB_NAME}
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{TEST_DB_NAME}"'))
    admin_engine.dispose()

    engine = create_engine(_sync_url(TEST_DB_NAME), poolclass=NullPool)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture(autouse=True)
def _clean_db(_test_engine):
    yield
    with _test_engine.begin() as conn:
        conn.execute(text(
            "TRUNCATE ratings, booking_status_log, bookings, drivers, customers, users CASCADE"
        ))


@pytest.fixture()
def client(_test_engine, monkeypatch):
    async_engine = create_async_engine(_async_test_url, poolclass=NullPool)
    session_factory = async_sessionmaker(bind=async_engine, expire_on_commit=False)

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    # The driver WS disconnect handler opens its own session (not via get_db) —
    # aim it at the test database too.
    monkeypatch.setattr("app.sockets.routes.AsyncSessionLocal", session_factory)
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    asyncio.run(async_engine.dispose())


@pytest.fixture()
def admin_headers(client) -> dict:
    res = client.post("/api/admin/login", json={
        "phone": settings.admin_phone, "password": settings.admin_password,
    })
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def _otp_login(client, phone: str, role: str) -> dict:
    """Full OTP flow for a given phone/role → Authorization headers."""
    res = client.post("/api/auth/send-otp",
                      json={"phone": phone, "email": f"{phone.lstrip('+')}@example.com"})
    assert res.status_code == 200, res.text
    otp = res.json().get("otp")
    assert otp, "otp echo disabled — enable settings.otp_echo_in_response for tests"
    res = client.post("/api/auth/verify-otp",
                      json={"phone": phone, "otp": otp, "role": role})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


@pytest.fixture()
def driver_headers(client) -> dict:
    return _otp_login(client, "+918000000001", "driver")


@pytest.fixture()
def customer_headers(client) -> dict:
    return _otp_login(client, "+918000000002", "customer")
