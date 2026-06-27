#!/usr/bin/env python3
"""
Database seeding script using SQLAlchemy.
Populates the vehicle_booking database with initial vehicle data.
"""

import asyncio
import sys
import os
import json
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text
from app.db.models import Base, Vehicle, VehicleType

# Database URL - using environment variable or default
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/vehicle_booking"
)

# Vehicle data with pricing strategy
VEHICLES_DATA = [
    # 5 Seater Cars
    {
        "registrationNumber": "TN-01-AB-1234",
        "name": "Toyota Innova Crysta 5-Seater",
        "type": VehicleType.CAR_5_SEATER,
        "seatingCapacity": 5,
        "pricePerKm": 12,
        "pricePerDay": 2200,
        "minimumCharge": 250,
        "driverAllowancePerDay": 300,
        "minimumDays": 1,
        "make": "Toyota",
        "model": "Innova Crysta",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "GPS", "FIRST_AID_KIT"],
        "description": "Premium 5-seater SUV with comfortable seating for small groups. Perfect for city tours and outstation trips.",
        "features": {"features": ["Pushback seats", "Individual AC vents", "Ample luggage space", "Premium audio system"]},
    },
    {
        "registrationNumber": "TN-01-AB-1235",
        "name": "Maruti Suzuki Ertiga 5-Seater",
        "type": VehicleType.CAR_5_SEATER,
        "seatingCapacity": 5,
        "pricePerKm": 12,
        "pricePerDay": 2200,
        "minimumCharge": 250,
        "driverAllowancePerDay": 300,
        "minimumDays": 1,
        "make": "Maruti Suzuki",
        "model": "Ertiga",
        "year": 2024,
        "fuelType": "CNG",
        "color": "Silver",
        "amenities": ["AC", "USB_CHARGING", "GPS", "FIRST_AID_KIT"],
        "description": "Economical 5-seater MPV with CNG option for fuel-efficient journeys.",
        "features": {"features": ["Reclining seats", "CNG fuel option", "Good mileage", "Spacious interior"]},
    },

    # 7 Seater Cars
    {
        "registrationNumber": "TN-01-AB-2234",
        "name": "Toyota Innova Crysta 7-Seater",
        "type": VehicleType.CAR_7_SEATER,
        "seatingCapacity": 7,
        "pricePerKm": 14,
        "pricePerDay": 2800,
        "minimumCharge": 300,
        "driverAllowancePerDay": 350,
        "minimumDays": 1,
        "make": "Toyota",
        "model": "Innova Crysta",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "Pearl White",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "PUSHBACK_SEATS"],
        "description": "Spacious 7-seater SUV ideal for family trips and corporate travel.",
        "features": {"features": ["Captain seats", "Premium audio", " ample luggage space", "LED lighting"]},
    },
    {
        "registrationNumber": "TN-01-AB-2235",
        "name": "Mahindra Scorpio-N 7-Seater",
        "type": VehicleType.CAR_7_SEATER,
        "seatingCapacity": 7,
        "pricePerKm": 14,
        "pricePerDay": 2800,
        "minimumCharge": 300,
        "driverAllowancePerDay": 350,
        "minimumDays": 1,
        "make": "Mahindra",
        "model": "Scorpio-N",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "Black",
        "amenities": ["AC", "USB_CHARGING", "GPS", "FIRST_AID_KIT", "PUSHBACK_SEATS"],
        "description": "Rugged 7-seater SUV perfect for adventure trips and rough terrains.",
        "features": {"features": ["Powerful engine", "Off-road capability", "Spacious", "Rugged suspension"]},
    },

    # 9 Seater Vehicles
    {
        "registrationNumber": "TN-01-AB-3234",
        "name": "Force Traveller 9-Seater",
        "type": VehicleType.CAR_9_SEATER,
        "seatingCapacity": 9,
        "pricePerKm": 15,
        "pricePerDay": 3200,
        "minimumCharge": 350,
        "driverAllowancePerDay": 400,
        "minimumDays": 1,
        "make": "Force Motors",
        "model": "Traveller 3350",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "PUSHBACK_SEATS", "READING_LIGHTS", "LUGGAGE_SPACE"],
        "description": "Comfortable 9-seater van for medium groups and family outings.",
        "features": {"features": ["Pushback seats", "Individual AC", "Ample luggage", "Premium interior"]},
    },
    {
        "registrationNumber": "TN-01-AB-3235",
        "name": "Maruti Suzuki Eeco 9-Seater",
        "type": VehicleType.CAR_9_SEATER,
        "seatingCapacity": 9,
        "pricePerKm": 15,
        "pricePerDay": 3200,
        "minimumCharge": 350,
        "driverAllowancePerDay": 400,
        "minimumDays": 1,
        "make": "Maruti Suzuki",
        "model": "Eeco",
        "year": 2024,
        "fuelType": "CNG",
        "color": "Metallic Blue",
        "amenities": ["AC", "USB_CHARGING", "GPS", "FIRST_AID_KIT", "LUGGAGE_SPACE"],
        "description": "Budget-friendly 9-seater van with CNG option for economical group travel.",
        "features": {"features": ["CNG option", "Economical", "Spacious", "Good mileage"]},
    },

    # 14 Seater Travellers
    {
        "registrationNumber": "TN-01-AB-4234",
        "name": "Force Traveller 14-Seater",
        "type": VehicleType.TRAVELLER_14_SEATER,
        "seatingCapacity": 14,
        "pricePerKm": 16,
        "pricePerDay": 3800,
        "minimumCharge": 400,
        "driverAllowancePerDay": 500,
        "minimumDays": 1,
        "make": "Force Motors",
        "model": "Traveller 3350",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "PUSHBACK_SEATS", "READING_LIGHTS", "LUGGAGE_SPACE", "WATER_BOTTLES"],
        "description": "Popular 14-seater minibus perfect for corporate outings, airport transfers, and group tours.",
        "features": {"features": ["Pushback seats", "Individual AC vents", "Ample luggage", "Premium audio"]},
    },
    {
        "registrationNumber": "TN-01-AB-4235",
        "name": "Tata Winger 14-Seater",
        "type": VehicleType.TRAVELLER_14_SEATER,
        "seatingCapacity": 14,
        "pricePerKm": 16,
        "pricePerDay": 3800,
        "minimumCharge": 400,
        "driverAllowancePerDay": 500,
        "minimumDays": 1,
        "make": "Tata Motors",
        "model": "Winger",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "USB_CHARGING", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "LUGGAGE_SPACE"],
        "description": "Reliable 14-seater van with comfortable seating for group travel.",
        "features": {"features": ["Reclining seats", "AC", "Spacious", "Comfortable suspension"]},
    },

    # 21 Seater Coaches
    {
        "registrationNumber": "TN-01-AB-5234",
        "name": "BharatBenz 21-Seater Coach",
        "type": VehicleType.COACH_21_SEATER,
        "seatingCapacity": 21,
        "pricePerKm": 18,
        "pricePerDay": 4500,
        "minimumCharge": 500,
        "driverAllowancePerDay": 600,
        "minimumDays": 1,
        "make": "BharatBenz",
        "model": "917 Coach",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White with Blue Stripe",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "PUSHBACK_SEATS", "READING_LIGHTS", "BLANKETS", "PILLOWS", "WATER_BOTTLES", "LUGGAGE_SPACE", "PASSENGER_DISPLAY"],
        "description": "Premium 21-seater coach for corporate groups, weddings, and special events.",
        "features": {"features": ["Reclining seats", "Individual entertainment", "Climate control", "Premium interior"]},
    },
    {
        "registrationNumber": "TN-01-AB-5235",
        "name": "Tata LPO 21-Seater Coach",
        "type": VehicleType.COACH_21_SEATER,
        "seatingCapacity": 21,
        "pricePerKm": 18,
        "pricePerDay": 4500,
        "minimumCharge": 500,
        "driverAllowancePerDay": 600,
        "minimumDays": 1,
        "make": "Tata Motors",
        "model": "LPO 1618",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "PUSHBACK_SEATS", "READING_LIGHTS", "LUGGAGE_SPACE"],
        "description": "Reliable 21-seater coach suitable for corporate and group travel.",
        "features": {"features": ["Pushback seats", "Entertainment system", "AC", "Good suspension"]},
    },

    # 24 Seater Coaches
    {
        "registrationNumber": "TN-01-AB-6234",
        "name": "Eicher 24-Seater Coach",
        "type": VehicleType.COACH_24_SEATER,
        "seatingCapacity": 24,
        "pricePerKm": 20,
        "pricePerDay": 5200,
        "minimumCharge": 600,
        "driverAllowancePerDay": 700,
        "minimumDays": 1,
        "make": "Eicher",
        "model": "2055T Coach",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White with Red Stripe",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "PUSHBACK_SEATS", "READING_LIGHTS", "BLANKETS", "PILLOWS", "WATER_BOTTLES", "SNACKS", "LUGGAGE_SPACE", "PASSENGER_DISPLAY", "MICROPHONE"],
        "description": "Luxurious 24-seater coach perfect for large groups, weddings, and corporate events.",
        "features": {"features": ["Luxury seats", "Full entertainment", "Pantry area", "Microphone system"]},
    },
    {
        "registrationNumber": "TN-01-AB-6235",
        "name": "BharatBenz 24-Seater Coach",
        "type": VehicleType.COACH_24_SEATER,
        "seatingCapacity": 24,
        "pricePerKm": 20,
        "pricePerDay": 5200,
        "minimumCharge": 600,
        "driverAllowancePerDay": 700,
        "minimumDays": 1,
        "make": "BharatBenz",
        "model": "1015 Coach",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White",
        "amenities": ["AC", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "PUSHBACK_SEATS", "READING_LIGHTS", "BLANKETS", "WATER_BOTTLES", "LUGGAGE_SPACE", "PASSENGER_DISPLAY"],
        "description": "Comfortable 24-seater coach for group travel and events.",
        "features": {"features": ["Pushback seats", "Entertainment", "Climate control", "Comfortable ride"]},
    },

    # 52 Seater Luxury Buses
    {
        "registrationNumber": "TN-01-AB-7234",
        "name": "Volvo 9400 52-Seater Luxury Bus",
        "type": VehicleType.BUS_52_SEATER,
        "seatingCapacity": 52,
        "pricePerKm": 24,
        "pricePerDay": 6500,
        "minimumCharge": 1000,
        "driverAllowancePerDay": 1000,
        "minimumDays": 2,
        "make": "Volvo",
        "model": "9400 B11R",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White with Graphics",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "PUSHBACK_SEATS", "READING_LIGHTS", "BLANKETS", "PILLOWS", "WATER_BOTTLES", "SNACKS", "LUGGAGE_SPACE", "PASSENGER_DISPLAY", "MICROPHONE", "REFRIGERATOR"],
        "description": "Premium luxury 52-seater Volvo bus for long-distance tours and corporate travel.",
        "features": {"features": ["Full recline seats", "Personal entertainment", "Onboard refreshments", "Refrigerator"]},
    },
    {
        "registrationNumber": "TN-01-AB-7235",
        "name": "Scania Metrolink 52-Seater Bus",
        "type": VehicleType.BUS_52_SEATER,
        "seatingCapacity": 52,
        "pricePerKm": 24,
        "pricePerDay": 6500,
        "minimumCharge": 1000,
        "driverAllowancePerDay": 1000,
        "minimumDays": 2,
        "make": "Scania",
        "model": "Metrolink HD",
        "year": 2024,
        "fuelType": "DIESEL",
        "color": "White with Blue Graphics",
        "amenities": ["AC", "WIFI", "USB_CHARGING", "ENTERTAINMENT_SYSTEM", "GPS", "FIRST_AID_KIT", "FIRE_EXTINGUISHER", "RECLINING_SEATS", "PUSHBACK_SEATS", "READING_LIGHTS", "BLANKETS", "PILLOWS", "WATER_BOTTLES", "SNACKS", "LUGGAGE_SPACE", "PASSENGER_DISPLAY", "MICROPHONE"],
        "description": "Luxury 52-seater Scania bus for premium travel experience.",
        "features": {"features": ["Premium seats", "Entertainment system", "Comfortable AC", "Spacious"]},
    },
]

# Common image for all vehicles
VEHICLE_IMAGE = "https://raw.githubusercontent.com/SriharanVJ/Trip-Booking/main/images/ChatGPT%20Image%20Jun%2011%2C%202026%2C%2007_49_37%20PM.png"


async def seed_database():
    """Seed the database with vehicle data."""

    # Create async engine
    engine = create_async_engine(
        DATABASE_URL,
        echo=False
    )

    # Create session
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )

    print("🌱 Starting database seeding...")

    try:
        async with async_session() as session:
            # Check if vehicles already exist
            result = await session.execute(select(Vehicle))
            existing_count = len(result.scalars().all())

            if existing_count > 0:
                print(f"⚠️  Database already has {existing_count} vehicles.")
                # Auto-clear if --force flag is provided
                if "--force" in sys.argv:
                    print("🔄 Force reseed enabled. Clearing existing vehicles.")
                else:
                    print("Use --force flag to clear and reseed.")
                    return

                # Clear existing vehicles
                await session.execute(text("DELETE FROM vehicles"))
                await session.commit()
                print("🗑️  Cleared existing vehicles.")

            # Add vehicles
            vehicles_to_create = []
            for vehicle_data in VEHICLES_DATA:
                vehicle = Vehicle(
                    **vehicle_data,
                    images=[VEHICLE_IMAGE],
                    thumbnailImage=VEHICLE_IMAGE,
                    isAvailable=True,
                    rating=0,
                    reviewCount=0
                )
                vehicles_to_create.append(vehicle)

            session.add_all(vehicles_to_create)
            await session.commit()

            print(f"✅ Successfully seeded {len(vehicles_to_create)} vehicles!")
            print("\n📊 Vehicle Summary:")

            # Count by type
            type_counts = {}
            for v in vehicles_to_create:
                vtype = v.type.value
                type_counts[vtype] = type_counts.get(vtype, 0) + 1

            for vtype, count in sorted(type_counts.items()):
                print(f"  • {vtype}: {count}")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_database())
