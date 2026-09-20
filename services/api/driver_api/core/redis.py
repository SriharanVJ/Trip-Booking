"""
Redis access layer with an in-memory fallback.

Used for:
  1. Key-value storage — OTPs (with TTL) and rate-limit counters.
  2. A geospatial index of online drivers (GEOADD / GEOSEARCH / ZREM).

When REDIS_URL is unset (local dev / POC), ``InMemoryKV`` and
``InMemoryGeoIndex`` provide the identical interface so the whole app runs
without a Redis server. Setting REDIS_URL switches both to Redis — no code
changes. (For multi-instance deployments Redis is required.)
"""

from __future__ import annotations

import time
from typing import Any

from driver_api.core.config import settings
from driver_api.utils.geo import haversine_km


class InMemoryKV:
    """Minimal subset of Redis string commands with TTLs."""

    def __init__(self) -> None:
        self._data: dict[str, tuple[str, float | None]] = {}

    def _evict_if_expired(self, key: str) -> bool:
        entry = self._data.get(key)
        if entry and entry[1] is not None and entry[1] <= time.monotonic():
            del self._data[key]
            return True
        return False

    async def get(self, key: str) -> str | None:
        self._evict_if_expired(key)
        entry = self._data.get(key)
        return entry[0] if entry else None

    async def setex(self, key: str, ttl_seconds: int, value: str) -> None:
        self._data[key] = (value, time.monotonic() + ttl_seconds)

    async def incr(self, key: str, ttl_seconds: int | None = None) -> int:
        """INCR; sets TTL on first increment when ttl_seconds is given."""
        self._evict_if_expired(key)
        entry = self._data.get(key)
        new_value = (int(entry[0]) if entry else 0) + 1
        expires_at = entry[1] if entry else (time.monotonic() + ttl_seconds if ttl_seconds else None)
        self._data[key] = (str(new_value), expires_at)
        return new_value

    async def delete(self, *keys: str) -> None:
        for key in keys:
            self._data.pop(key, None)


class RedisKV:
    def __init__(self, client) -> None:
        self._client = client

    async def get(self, key: str) -> str | None:
        return await self._client.get(key)

    async def setex(self, key: str, ttl_seconds: int, value: str) -> None:
        await self._client.setex(key, ttl_seconds, value)

    async def incr(self, key: str, ttl_seconds: int | None = None) -> int:
        value = await self._client.incr(key)
        if value == 1 and ttl_seconds:
            await self._client.expire(key, ttl_seconds)
        return value

    async def delete(self, *keys: str) -> None:
        if keys:
            await self._client.delete(*keys)


class InMemoryGeoIndex:
    """GEOADD/GEOSEARCH subset: members keyed by id with (lng, lat)."""

    def __init__(self) -> None:
        self._members: dict[str, tuple[float, float]] = {}  # member -> (lng, lat)

    async def geoadd(self, key: str, member: str, lng: float, lat: float) -> None:
        self._members[member] = (lng, lat)

    async def zrem(self, key: str, member: str) -> None:
        self._members.pop(member, None)

    async def geosearch_radius(
        self, key: str, lng: float, lat: float, radius_km: float, limit: int
    ) -> list[tuple[str, float]]:
        """Members within radius, sorted by distance: [(member, dist_km)]."""
        results = []
        for member, (m_lng, m_lat) in self._members.items():
            dist = haversine_km(lat, lng, m_lat, m_lng)
            if dist <= radius_km:
                results.append((member, dist))
        results.sort(key=lambda item: item[1])
        return results[:limit]

    async def geosearch(
        self, key: str, longitude: float, latitude: float,
        radius_km: float, limit: int = 50,
    ) -> list[tuple[str, float]]:
        """Kwarg-named alias used by the matching service."""
        return await self.geosearch_radius(key, longitude, latitude, radius_km, limit)


class RedisGeoIndex:
    def __init__(self, client) -> None:
        self._client = client

    async def geoadd(self, key: str, member: str, lng: float, lat: float) -> None:
        await self._client.geoadd(key, {member: (lng, lat)})

    async def zrem(self, key: str, member: str) -> None:
        await self._client.zrem(key, member)

    async def geosearch_radius(
        self, key: str, lng: float, lat: float, radius_km: float, limit: int
    ) -> list[tuple[str, float]]:
        rows = await self._client.execute_command(
            "GEOSEARCH", key, "FROMLONLAT", lng, lat,
            "BYRADIUS", radius_km, "km", "WITHDIST", "ASC", "COUNT", limit,
        )
        return [(member, float(dist)) for member, dist in rows]

    async def geosearch(
        self, key: str, longitude: float, latitude: float,
        radius_km: float, limit: int = 50,
    ) -> list[tuple[str, float]]:
        """Kwarg-named alias used by the matching service."""
        return await self.geosearch_radius(key, longitude, latitude, radius_km, limit)


class RedisService:
    """Singleton bundling KV + GEO access, Redis-backed when configured."""

    def __init__(self) -> None:
        self._redis: Any = None
        if settings.redis_url:
            import redis.asyncio as aioredis

            self._redis = aioredis.from_url(
                settings.redis_url, decode_responses=True, max_connections=20
            )
            self.kv: InMemoryKV | RedisKV = RedisKV(self._redis)
            self.geo: InMemoryGeoIndex | RedisGeoIndex = RedisGeoIndex(self._redis)
            self.backend = "redis"
        else:
            self.kv = InMemoryKV()
            self.geo = InMemoryGeoIndex()
            self.backend = "memory"

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.aclose()


DRIVERS_GEO_KEY = "drivers:online:geo"

redis_service = RedisService()
