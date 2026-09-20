"""An online driver logging out / closing the tab must end up offline.

Logout used to only clear the browser session and a driver WebSocket closing
only dropped the socket-registry entry — `is_online` stayed true and matching
kept picking the vanished driver. The WS disconnect is now the offline
transition, except mid-trip: a driver on a job stays online.
"""

import asyncio
import time

import pytest
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from driver_api.core.redis import DRIVERS_GEO_KEY, redis_service
from driver_api.services.driver_service import rewarm_geo_index

from tests.conftest import _async_test_url, _otp_login

CREATE_URL = "/api/admin/drivers"


def _create_verified_driver(client, admin_headers, phone):
    res = client.post(CREATE_URL, headers=admin_headers, json={
        "phone": phone, "name": "Ravi Kumar",
        "license_no": "TN01 20230045678", "license_doc_url": None,
        "pre_verified": True,
    })
    assert res.status_code == 201, res.text
    return res.json()


def _go_online(client, headers, lat=12.9719, lng=77.6412):
    assert client.patch("/api/driver/location", headers=headers,
                        json={"lat": lat, "lng": lng}).status_code == 200
    res = client.patch("/api/driver/online-status", headers=headers,
                       json={"is_online": True})
    assert res.status_code == 200, res.text
    return res.json()


def _admin_driver(client, admin_headers, driver_id):
    res = client.get("/api/admin/drivers", headers=admin_headers)
    assert res.status_code == 200, res.text
    return next(d for d in res.json()["drivers"] if d["driver_id"] == driver_id)


def _wait_offline(client, admin_headers, driver_id, timeout=2.0):
    """The disconnect handler runs server-side after the client socket closes —
    give it a moment instead of asserting on a race."""
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if _admin_driver(client, admin_headers, driver_id)["is_online"] is False:
            return
        time.sleep(0.05)
    pytest.fail("driver still online after WebSocket disconnect")


def _ws(client, user_id, headers):
    token = headers["Authorization"].split(" ", 1)[1]
    return client.websocket_connect(f"/ws/driver/{user_id}?token={token}")


def test_ws_disconnect_takes_online_driver_offline(client, admin_headers):
    profile = _create_verified_driver(client, admin_headers, "+918000000011")
    headers = _otp_login(client, "+918000000011", "driver")
    assert _go_online(client, headers)["is_online"] is True

    with _ws(client, profile["user_id"], headers) as ws:
        ws.send_text("ping")
        assert ws.receive_json() == {"event": "pong", "data": {}}
        # Close and wait INSIDE the with-block: leaving it cancels the server
        # task, which would cut the disconnect handler off mid-cleanup.
        ws.close()
        _wait_offline(client, admin_headers, profile["driver_id"])


def test_ws_disconnect_mid_trip_stays_online(client, admin_headers, customer_headers):
    profile = _create_verified_driver(client, admin_headers, "+918000000012")
    headers = _otp_login(client, "+918000000012", "driver")
    _go_online(client, headers)

    res = client.post("/api/bookings", headers=customer_headers, json={
        "type": "location",
        "pickup_lat": 12.9719, "pickup_lng": 77.6412,
        "pickup_address_text": "Indiranagar, 100ft Road",
        "drop_lat": 12.9352, "drop_lng": 77.6245,
        "drop_address_text": "Koramangala, 4th Block",
    })
    assert res.status_code == 200, res.text
    booking_id = res.json()["booking"]["id"]
    res = client.post(f"/api/bookings/{booking_id}/accept", headers=headers)
    assert res.status_code == 200, res.text

    with _ws(client, profile["user_id"], headers) as ws:
        ws.close()  # connect + drop — like the app dying mid-trip
        time.sleep(0.3)  # let the disconnect handler run its (early-return) course

    # On a job: a dropped connection must not flip them offline.
    assert _admin_driver(client, admin_headers, profile["driver_id"])["is_online"] is True


def _nearby_members(lat, lng):
    nearby = asyncio.run(redis_service.geo.geosearch(
        DRIVERS_GEO_KEY, longitude=lng, latitude=lat, radius_km=5))
    return [member for member, _ in nearby]


def test_ws_reconnect_rewarms_geo_index(client, admin_headers):
    """A backend restart empties the in-memory geo index while the DB keeps
    `is_online=true` — the socket reconnect must put the driver back into the
    matching pool (previously they stayed invisible until they toggled
    offline→online by hand)."""
    profile = _create_verified_driver(client, admin_headers, "+918000000013")
    headers = _otp_login(client, "+918000000013", "driver")
    assert _go_online(client, headers, lat=13.25, lng=77.55)["is_online"] is True

    # Simulate the restart: the index forgets the driver entirely.
    asyncio.run(redis_service.geo.zrem(DRIVERS_GEO_KEY, profile["user_id"]))
    assert profile["user_id"] not in _nearby_members(13.25, 77.55)

    with _ws(client, profile["user_id"], headers) as ws:
        # The pong only comes back once the handler's reconnect re-warm has
        # finished (it runs before the read loop) — no sleep-and-hope race.
        ws.send_text("ping")
        assert ws.receive_json() == {"event": "pong", "data": {}}
        assert profile["user_id"] in _nearby_members(13.25, 77.55)


def test_boot_rewarm_restores_online_drivers_without_ws(client, admin_headers):
    """Boot recovery: an online driver with no socket at all (panel closed
    across a restart) must still re-enter the matching pool, from the DB."""
    profile = _create_verified_driver(client, admin_headers, "+918000000015")
    headers = _otp_login(client, "+918000000015", "driver")
    _go_online(client, headers, lat=13.26, lng=77.56)
    asyncio.run(redis_service.geo.zrem(DRIVERS_GEO_KEY, profile["user_id"]))
    assert profile["user_id"] not in _nearby_members(13.26, 77.56)

    engine = create_async_engine(_async_test_url, poolclass=NullPool)

    async def scenario():
        factory = async_sessionmaker(bind=engine, expire_on_commit=False)
        async with factory() as db:
            return await rewarm_geo_index(db)

    try:
        warmed = asyncio.run(scenario())
    finally:
        asyncio.run(engine.dispose())

    assert warmed >= 1
    assert profile["user_id"] in _nearby_members(13.26, 77.56)


def test_ws_connect_does_not_warm_offline_driver(client, admin_headers):
    profile = _create_verified_driver(client, admin_headers, "+918000000014")
    headers = _otp_login(client, "+918000000014", "driver")
    _go_online(client, headers, lat=13.30, lng=77.60)
    assert client.patch("/api/driver/online-status", headers=headers,
                        json={"is_online": False}).status_code == 200

    with _ws(client, profile["user_id"], headers):
        assert profile["user_id"] not in _nearby_members(13.30, 77.60)
