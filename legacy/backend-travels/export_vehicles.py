#!/usr/bin/env python3
import asyncio
import json
import sys
import os
sys.path.insert(0, '.')

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from app.db.models import Vehicle
from dotenv import load_dotenv

load_dotenv()

async def export_vehicles():
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres@localhost:5432/vehicle_booking")
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        result = await session.execute(select(Vehicle))
        vehicles = result.scalars().all()

        print(f"# {len(vehicles)} vehicles from database\n")
        print("VEHICLES_DATA = [")
        for v in vehicles:
            print(f"    {{")
            print(f'        "registrationNumber": "{v.registrationNumber}",')
            print(f'        "name": "{v.name}",')
            print(f'        "type": VehicleType.{v.type.name},')
            print(f'        "seatingCapacity": {v.seatingCapacity},')
            print(f'        "pricePerKm": {float(v.pricePerKm)},')
            price_day = f'        "pricePerDay": {float(v.pricePerDay)},' if hasattr(v, "pricePerDay") and v.pricePerDay else '        "pricePerDay": null,'
            print(price_day)
            print(f'        "minimumCharge": {float(v.minimumCharge)},')
            print(f'        "driverAllowancePerDay": {float(v.driverAllowancePerDay)},')
            print(f'        "minimumDays": {v.minimumDays},')
            print(f'        "make": "{v.make}",')
            print(f'        "model": "{v.model}",')
            print(f'        "year": {v.year},')
            print(f'        "fuelType": "{v.fuelType}",')
            print(f'        "color": "{v.color}",')
            amenities = v.amenities if v.amenities else []
            print(f'        "amenities": {amenities},')
            print(f'        "description": "{v.description}",')
            features = v.features if v.features else {}
            print(f'        "features": {features},')
            print(f'        "thumbnailImage": "{v.thumbnailImage if v.thumbnailImage else ""}",')
            images = v.images if v.images else []
            print(f'        "images": {images},')
            print(f'        "rating": {float(v.rating) if v.rating else 0},')
            print(f'        "isAvailable": {v.isAvailable}')
            print(f"    }},")
        print("]")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(export_vehicles())
