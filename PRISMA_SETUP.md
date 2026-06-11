# Prisma Setup for Vehicle Booking System

Complete Prisma setup documentation for the vehicle booking application with PostgreSQL database.

## Quick Start

```bash
# Install dependencies
npm install

# Update .env with your PostgreSQL credentials
cp .env.example .env

# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database with sample data
npm run prisma:seed

# Open Prisma Studio to view data
npx prisma studio
```

## Database Configuration

### 1. Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE vehicle_booking;

# Exit
\q
```

### 2. Update DATABASE_URL in .env

```env
DATABASE_URL="postgresql://username:password@localhost:5432/vehicle_booking?schema=public"
```

## Prisma Schema Overview

### Vehicle Types & Pricing

| Vehicle Type | Price/KM | Min Charge | Driver/Day | Seats |
|-------------|----------|------------|------------|-------|
| CAR_5_SEATER | ₹12 | ₹250 | ₹300 | 5 |
| CAR_7_SEATER | ₹15 | ₹300 | ₹350 | 7 |
| CAR_9_SEATER | ₹18 | ₹350 | ₹400 | 9 |
| TRAVELLER_14_SEATER | ₹22 | ₹400 | ₹500 | 14 |
| COACH_21_SEATER | ₹28 | ₹500 | ₹600 | 21 |
| COACH_24_SEATER | ₹32 | ₹600 | ₹700 | 24 |
| BUS_52_SEATER | ₹45 | ₹1000 | ₹1000 | 52 |

### Core Models

#### 1. Vehicle
Fleet vehicles with seating capacity and amenities
- Pricing: Per KM, minimum charge, driver allowance
- Amenities: AC, WiFi, USB charging, entertainment, GPS
- Maintenance tracking: Service dates, insurance, certifications
- Rating system

#### 2. Customer
Customer accounts with corporate support
- Personal details and KYC information
- Corporate account options with GST
- Authentication and verification

#### 3. Booking
Trip bookings with flexible routing
- **Trip Types**: One-way, Round-trip, Multi-city
- **Pricing**: Distance, driver allowance, toll, parking, night halt
- **Status**: PENDING → CONFIRMED → COMPLETED
- **Payment Tracking**: Advance paid, balance due

#### 4. Payment
Payment transaction records
- Multiple payment methods: Cash, Card, UPI, Bank Transfer
- Gateway integration support
- Refund tracking

#### 5. Admin
Admin users for dashboard access
- Role-based permissions
- Activity logging
- Super admin capabilities

#### 6. VehicleAvailability
Availability calendar for optimization
- Date/time-based availability
- Current location tracking
- Maintenance blocking

#### 7. Additional Models
- **ActivityLog**: Admin action tracking
- **MaintenanceLog**: Vehicle maintenance records
- **PromoCode**: Discount codes with usage limits
- **SystemConfig**: Application settings

## Enums

### VehicleType
```prisma
enum VehicleType {
  CAR_5_SEATER
  CAR_7_SEATER
  CAR_9_SEATER
  TRAVELLER_14_SEATER
  COACH_21_SEATER
  COACH_24_SEATER
  BUS_52_SEATER
}
```

### BookingStatus
```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  REFUNDED
}
```

### Amenities
```prisma
enum Amenities {
  AC, NON_AC, WIFI, USB_CHARGING,
  ENTERTAINMENT_SYSTEM, GPS, FIRST_AID_KIT,
  FIRE_EXTINGUISHER, REFRIGERATOR, RECLINING_SEATS,
  PUSHBACK_SEATS, READING_LIGHTS, BLANKETS,
  PILLOWS, WATER_BOTTLES, SNACKS, LUGGAGE_SPACE,
  HANDICAP_ACCESSIBLE, PASSENGER_DISPLAY, MICROPHONE
}
```

## Seed Data

Running `npm run prisma:seed` creates:

### Vehicles (14 total)
- 2x CAR_5_SEATER (Innova Crysta, Ertiga)
- 2x CAR_7_SEATER (Innova Crysta, Scorpio-N)
- 2x CAR_9_SEATER (Traveller 3350, Eeco)
- 2x TRAVELLER_14_SEATER (Traveller 3350, Winger)
- 2x COACH_21_SEATER (BharatBenz, Tata LPO)
- 2x COACH_24_SEATER (Eicher, BharatBenz)
- 2x BUS_52_SEATER (Volvo 9400, Scania Metrolink)

### Customers (3)
- 2 individual customers
- 1 corporate customer (Technology Solutions Pvt Ltd)

### Admin User (1)
- Email: admin@busbooking.com
- Role: SUPER_ADMIN

### Promo Codes (3)
- WELCOME10: 10% off for new users (max ₹500)
- FESTIVE500: Flat ₹500 off round-trip bookings
- GROUP15: 15% off on 21+ seater vehicles

## Common Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Create migration
npx prisma migrate dev --name <migration_name>

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Pull schema from database
npx prisma db pull

# Format schema
npx prisma format
```

## Project Structure

```
Bus_Booking/
├── prisma/
│   ├── schema.prisma      # Complete database schema
│   └── seed.ts            # Sample data generation
├── .env                   # Environment variables (gitignored)
├── .env.example          # Environment template
├── package.json          # Node dependencies
└── tsconfig.json         # TypeScript config
```

## Using Prisma Client

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Query vehicles
const vehicles = await prisma.vehicle.findMany({
  where: { type: 'CAR_7_SEATER', isAvailable: true }
})

// Create booking
const booking = await prisma.booking.create({
  data: {
    customerId: 'customer-id',
    vehicleId: 'vehicle-id',
    tripType: 'ONE_WAY',
    pickupLocation: 'Chennai',
    dropLocation: 'Bangalore',
    startDate: new Date('2024-02-01'),
    totalAmount: 5000
  }
})
```

## Troubleshooting

### Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Verify database exists
psql -U postgres -l

# Test connection
psql -U postgres -d vehicle_booking
```

### Seed Errors
```bash
# Reset and re-seed
npx prisma migrate reset
npm run prisma:seed
```

## Production Deployment

1. Update `.env` with production database URL
2. Use connection pooling (PgBouncer)
3. Enable SSL for database connections
4. Set up automated backups
5. Use managed database service (AWS RDS, Neon, Supabase)

## Files Created

- `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/prisma/schema.prisma`
- `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/prisma/seed.ts`
- `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/.env.example`
- `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/package.json`
- `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/tsconfig.json`
