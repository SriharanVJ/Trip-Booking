"""WebSocket endpoints (spec 5).

Auth note: browsers can't set headers on WebSocket handshakes, so the JWT
travels as a query param (?token=...). The path {id} must match the token's
subject — you can only listen to your own channel.

Envelope: {"event": "<name>", "data": {...}}
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from driver_api.core.db import AsyncSessionLocal
from driver_api.core.security import decode_token
from driver_api.models import Role
from driver_api.sockets.manager import manager
from driver_api.services.driver_service import handle_disconnect, handle_reconnect
from driver_api.utils.errors import AppError

router = APIRouter()


async def _authenticate(websocket: WebSocket, token: str, expected_role: Role,
                        channel_id: uuid.UUID) -> uuid.UUID | None:
    """Returns the authenticated user id, or None after closing the socket."""
    try:
        payload = decode_token(token)
        user_id = uuid.UUID(str(payload["sub"]))
        if payload.get("role") != expected_role.value or user_id != channel_id:
            raise AppError.forbidden("Socket channel does not match token")
    except Exception:
        await websocket.close(code=4401, reason="Invalid or expired token")
        return None
    return user_id


@router.websocket("/ws/driver/{driver_user_id}")
async def driver_socket(websocket: WebSocket, driver_user_id: uuid.UUID,
                        token: str = Query("")):
    user_id = await _authenticate(websocket, token, Role.DRIVER, driver_user_id)
    if user_id is None:
        return
    await manager.connect(user_id, websocket)
    # Re-warm the matching geo index on every (re)connect — it's in-memory in
    # single-instance dev, so a backend restart empties it while the DB keeps
    # is_online=true (the driver panel reconnects automatically within ~2s).
    async with AsyncSessionLocal() as db:
        await handle_reconnect(db, user_id)
    try:
        while True:
            # Client → server messages are only keepalive pings for now
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
        # Socket gone with no replacement (logout, tab close, crash) → also
        # flip the driver offline so matching stops picking them.
        if not manager.is_online(user_id):
            async with AsyncSessionLocal() as db:
                await handle_disconnect(db, user_id)


@router.websocket("/ws/customer/{customer_user_id}")
async def customer_socket(websocket: WebSocket, customer_user_id: uuid.UUID,
                          token: str = Query("")):
    user_id = await _authenticate(websocket, token, Role.CUSTOMER, customer_user_id)
    if user_id is None:
        return
    await manager.connect(user_id, websocket)
    try:
        while True:
            message = await websocket.receive_text()
            if message == "ping":
                await websocket.send_json({"event": "pong", "data": {}})
    except WebSocketDisconnect:
        manager.disconnect(user_id, websocket)
