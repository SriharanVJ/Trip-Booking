"""Matching dispatch-round regression tests.

The search loop swallows exceptions by design (a crashed round must never
kill the app) — which once hid a broken geo-index call: matching asked for
`geo.geosearch(...)` while the index classes only implemented
`geosearch_radius`, so every round died with an AttributeError, the booking
stayed `searching`, and no `booking:new_request` ever went out. These tests
pin the geosearch → DB-filter → offer path with the real in-memory geo index.
"""

import asyncio
import uuid

import driver_api.services.matching_service as matching_module
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from driver_api.core.redis import DRIVERS_GEO_KEY, redis_service
from driver_api.services.driver_service import rewarm_geo_index

from tests.conftest import _async_test_url, _otp_login

# Unique spot ~26 km from every other fixture location so geo-index leftovers
# from other tests can't pollute the radius.
LAT, LNG = 13.20, 77.50


def _create_verified_driver(client, admin_headers, phone):
    res = client.post("/api/admin/drivers", headers=admin_headers, json={
        "phone": phone, "name": "Ravi Kumar",
        "license_no": "TN01 20230045678", "license_doc_url": None,
        "pre_verified": True,
    })
    assert res.status_code == 201, res.text
    return res.json()


def _go_online(client, headers, lat=LAT, lng=LNG):
    assert client.patch("/api/driver/location", headers=headers,
                        json={"lat": lat, "lng": lng}).status_code == 200
    res = client.patch("/api/driver/online-status", headers=headers,
                       json={"is_online": True})
    assert res.status_code == 200, res.text
    return res.json()


def test_geosearch_is_the_matching_call_interface():
    """Pin the method name + kwargs the matching loop calls — both index
    backends must answer it (AttributeError here = silent search death)."""

    async def scenario():
        await redis_service.geo.geoadd(DRIVERS_GEO_KEY, "member-1", LNG, LAT)
        try:
            return await redis_service.geo.geosearch(
                DRIVERS_GEO_KEY, longitude=LNG, latitude=LAT, radius_km=5,
            )
        finally:
            await redis_service.geo.zrem(DRIVERS_GEO_KEY, "member-1")

    nearby = asyncio.run(scenario())
    assert [member for member, _ in nearby] == ["member-1"]


def test_dispatch_round_offers_nearby_online_driver(client, admin_headers,
                                                    customer_headers, monkeypatch):
    profile = _create_verified_driver(client, admin_headers, "+918000000021")
    headers = _otp_login(client, "+918000000021", "driver")
    _go_online(client, headers)

    res = client.post("/api/bookings", headers=customer_headers, json={
        "type": "location",
        "pickup_lat": LAT, "pickup_lng": LNG,
        "pickup_address_text": "Test pickup",
        "drop_lat": LAT + 0.02, "drop_lng": LNG + 0.02,
        "drop_address_text": "Test drop",
    })
    assert res.status_code == 200, res.text
    booking_id = uuid.UUID(res.json()["booking"]["id"])

    captured = {}

    async def _fake_emit_many(user_ids, event, data):
        captured["ids"] = [str(u) for u in user_ids]
        captured["event"] = event
        captured["data"] = data

    monkeypatch.setattr(matching_module, "emit_many", _fake_emit_many)
    # The dispatch round opens its own session — aim it at the test DB.
    engine = create_async_engine(_async_test_url, poolclass=NullPool)
    monkeypatch.setattr(
        matching_module, "AsyncSessionLocal",
        async_sessionmaker(bind=engine, expire_on_commit=False),
    )
    try:
        asyncio.run(matching_module.matching_service._dispatch_round(
            booking_id, attempt=0, radius_km=5,
        ))
    finally:
        asyncio.run(engine.dispose())

    assert captured["event"] == "booking:new_request"
    assert profile["user_id"] in captured["ids"]
    # The driver panel reads data["booking"] (same envelope as booking:accepted)
    # — a flat payload here is silently dropped by the UI.
    assert captured["data"]["booking"]["id"] == str(booking_id)
    assert captured["data"]["booking"]["pickup"]["approximate"] is True


def test_boot_resume_rekicks_orphaned_search(client, admin_headers,
                                             customer_headers, monkeypatch):
    """A restart kills the in-process search task while the booking stays
    `searching` in the DB — boot recovery must re-kick it, or it polls
    forever with no loop running."""
    profile = _create_verified_driver(client, admin_headers, "+918000000023")
    headers = _otp_login(client, "+918000000023", "driver")
    _go_online(client, headers)

    res = client.post("/api/bookings", headers=customer_headers, json={
        "type": "location",
        "pickup_lat": LAT, "pickup_lng": LNG,
        "pickup_address_text": "Test pickup",
        "drop_lat": LAT + 0.02, "drop_lng": LNG + 0.02,
        "drop_address_text": "Test drop",
    })
    assert res.status_code == 200, res.text
    booking_id = uuid.UUID(res.json()["booking"]["id"])

    # Simulate the restart: loop gone, index empty.
    matching_module.matching_service.stop_search(booking_id)
    asyncio.run(redis_service.geo.zrem(DRIVERS_GEO_KEY, profile["user_id"]))

    offers: list[list[str]] = []

    async def _fake_emit_many(user_ids, event, data):
        if event == "booking:new_request":
            offers.append([str(u) for u in user_ids])

    monkeypatch.setattr(matching_module, "emit_many", _fake_emit_many)
    # Boot recovery and its re-kicked loops open their own sessions — aim
    # them at the test DB.
    engine = create_async_engine(_async_test_url, poolclass=NullPool)
    monkeypatch.setattr(
        matching_module, "AsyncSessionLocal",
        async_sessionmaker(bind=engine, expire_on_commit=False),
    )

    async def scenario():
        # Same order as the app's lifespan: re-warm the index, then resume.
        async with async_sessionmaker(bind=engine, expire_on_commit=False)() as db:
            warmed = await rewarm_geo_index(db)
        assert warmed >= 1
        resumed = await matching_module.matching_service.resume_orphaned_searches()
        assert resumed >= 1
        # The re-kicked loop's first round runs immediately — wait for it.
        loop = asyncio.get_running_loop()
        deadline = loop.time() + 5
        while loop.time() < deadline:
            if any(profile["user_id"] in ids for ids in offers):
                break
            await asyncio.sleep(0.05)
        # Don't leave background rounds running past the engine disposal.
        for tid in list(matching_module.matching_service._tasks):
            matching_module.matching_service.stop_search(tid)

    try:
        asyncio.run(scenario())
    finally:
        asyncio.run(engine.dispose())

    assert any(profile["user_id"] in ids for ids in offers), offers
