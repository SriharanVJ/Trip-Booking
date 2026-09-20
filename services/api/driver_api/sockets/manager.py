"""ConnectionManager — tracks active WebSocket connections per user id.

One socket per user; a new connection replaces a stale one. All pushes go
through the shared envelope ``{"event": ..., "data": ...}``.
"""

from __future__ import annotations

import uuid
from typing import Iterable

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._active: dict[uuid.UUID, WebSocket] = {}

    async def connect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        previous = self._active.get(user_id)
        if previous is not None and previous is not websocket:
            try:
                await previous.close(code=4001, reason="Superseded by a new connection")
            except Exception:  # pragma: no cover - already gone
                pass
        self._active[user_id] = websocket

    def disconnect(self, user_id: uuid.UUID, websocket: WebSocket) -> None:
        if self._active.get(user_id) is websocket:
            del self._active[user_id]

    def is_online(self, user_id: uuid.UUID) -> bool:
        return user_id in self._active

    async def send_to_user(self, user_id: uuid.UUID, payload: dict) -> bool:
        websocket = self._active.get(user_id)
        if websocket is None:
            return False
        try:
            await websocket.send_json(payload)
            return True
        except Exception:  # pragma: no cover - socket died mid-send
            self.disconnect(user_id, websocket)
            return False

    async def send_to_users(self, user_ids: Iterable[uuid.UUID], payload: dict) -> list[uuid.UUID]:
        delivered: list[uuid.UUID] = []
        for user_id in set(user_ids):
            if await self.send_to_user(user_id, payload):
                delivered.append(user_id)
        return delivered


manager = ConnectionManager()
