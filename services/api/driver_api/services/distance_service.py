"""Distance/duration provider abstraction (spec 1).

MockDistanceProvider is active by default (haversine x road factor).
Swap in a real Google Distance Matrix implementation later without
touching call sites — implement `DistanceProvider.get` and register the
provider in `_build_provider`.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass

import httpx

from driver_api.core.config import settings
from driver_api.utils.geo import haversine_km

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class DistanceResult:
    distance_km: float
    duration_min: float


class DistanceProvider(ABC):
    @abstractmethod
    async def get(self, origin_lat: float, origin_lng: float,
                  dest_lat: float, dest_lng: float) -> DistanceResult:
        """Road distance/duration between two coordinates."""

    async def distance_km(self, origin_lat: float, origin_lng: float,
                          dest_lat: float, dest_lng: float) -> float:
        result = await self.get(origin_lat, origin_lng, dest_lat, dest_lng)
        return result.distance_km


class MockDistanceProvider(DistanceProvider):
    """Deterministic offline estimate: haversine x road factor at avg speed."""

    def __init__(self, road_factor: float = 1.3, avg_speed_kmh: float = 25.0):
        self.road_factor = road_factor
        self.avg_speed_kmh = avg_speed_kmh

    async def get(self, origin_lat: float, origin_lng: float,
                  dest_lat: float, dest_lng: float) -> DistanceResult:
        straight = haversine_km(origin_lat, origin_lng, dest_lat, dest_lng)
        distance_km = round(straight * self.road_factor, 2)
        duration_min = round(distance_km / self.avg_speed_kmh * 60, 1) if distance_km else 0.0
        return DistanceResult(distance_km=distance_km, duration_min=duration_min)


class GoogleMapsDistanceProvider(DistanceProvider):
    """Real provider skeleton — needs GOOGLE_MAPS_API_KEY in settings.

    Endpoint shape (Distance Matrix API):
      https://maps.googleapis.com/maps/api/distancematrix/json
        ?origins=lat,lng&destinations=lat,lng&mode=driving&key=...
    """

    def __init__(self, api_key: str):
        self.api_key = api_key

    async def get(self, origin_lat: float, origin_lng: float,
                  dest_lat: float, dest_lng: float) -> DistanceResult:
        # TODO: wire up once a key is provisioned; fall back to mock until then.
        raise NotImplementedError(
            "Google Maps provider not configured — set DISTANCE_PROVIDER=mock "
            "or implement GoogleMapsDistanceProvider.get()"
        )


def _build_provider() -> DistanceProvider:
    provider = settings.distance_provider
    if provider == "google-maps":
        return GoogleMapsDistanceProvider(api_key="")  # placeholder
    return MockDistanceProvider(
        road_factor=settings.mock_road_factor,
        avg_speed_kmh=settings.mock_avg_speed_kmh,
    )


distance_service = _build_provider()
