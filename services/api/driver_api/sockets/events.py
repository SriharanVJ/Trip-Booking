"""Event helpers — services call these instead of touching sockets directly.

Envelope: {"event": "<name>", "data": {...}}
Events (spec 5):
  driver   ← booking:new_request, booking:cancelled
  customer ← booking:accepted, booking:status_update, booking:cancelled,
             booking:no_drivers, driver:location_update
"""

from __future__ import annotations

import uuid

from driver_api.sockets.manager import manager


async def emit(user_id: uuid.UUID, event: str, data: dict) -> bool:
    return await manager.send_to_user(user_id, {"event": event, "data": data})


async def emit_many(user_ids, event: str, data: dict) -> list[uuid.UUID]:
    return await manager.send_to_users(user_ids, {"event": event, "data": data})
