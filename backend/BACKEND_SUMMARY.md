# Backend API Endpoints - Summary

## Files Created/Updated

### Core Files
1. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/db/models.py` - Updated with Prisma-aligned models
2. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/schemas/vehicle.py` - Complete API schemas
3. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/prisma/client.py` - Prisma client integration
4. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/core/auth.py` - Authentication middleware
5. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/core/deps.py` - Dependency injection

### Endpoint Files
6. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/vehicles.py` - Vehicle endpoints
7. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/bookings.py` - Booking endpoints
8. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/availability.py` - Availability endpoints
9. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/api.py` - Updated to include new routers

### Service Files
10. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/services/pricing.py` - Price calculation service

### Documentation
11. `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/API_ENDPOINTS.md` - Complete API documentation

---

## API Endpoints Summary

### Vehicle Endpoints (`/api/v1/vehicles`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/vehicles` | List all vehicles with filters |
| GET | `/vehicles/{id}` | Get vehicle details by ID |
| GET | `/vehicles/categories` | Get vehicle categories |
| GET | `/vehicles/types` | Get vehicle types |
| GET | `/vehicles/available` | Check available vehicles for date range |
| POST | `/vehicles/{id}/check-availability` | Check specific vehicle availability |

### Booking Endpoints (`/api/v1/bookings`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bookings` | Create new booking |
| GET | `/bookings` | List bookings with filters |
| GET | `/bookings/{id}` | Get booking details |
| GET | `/bookings/number/{number}` | Get booking by number |
| PUT | `/bookings/{id}` | Update booking |
| PUT | `/bookings/{id}/cancel` | Cancel booking |
| PUT | `/bookings/{id}/confirm` | Confirm booking |
| PUT | `/bookings/{id}/complete` | Mark as completed |
| POST | `/bookings/estimate` | Get price estimate for trip |

### Availability Endpoints (`/api/v1/availability`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/availability/vehicles` | Get available vehicles by date |
| GET | `/availability/vehicle/{id}` | Check specific vehicle availability |
| POST | `/availability/vehicle/{id}/block` | Block vehicle availability (Admin) |
| DELETE | `/availability/vehicle/{id}/block` | Remove vehicle block (Admin) |
| GET | `/availability/summary` | Get availability summary |

---

## Price Calculation Service Features

The pricing service (`/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/services/pricing.py`) includes:

1. **Base Fare Calculation**: Distance × Per km rate
2. **Minimum Charges**: Applies minimum charge guarantee
3. **Driver Allowance**: Per day driver charges
4. **Toll Charges**: Optional per-km toll calculation
5. **Parking Charges**: Optional daily parking fees
6. **Night Halt Charges**: Multi-day trip charges
7. **Round-trip Discount**: 10-20% discount for round trips
8. **Service Tax**: 18% GST calculation
9. **Promo Discounts**: Support for promo code discounts
10. **Multi-city Trip Pricing**: Support for complex multi-stop trips
11. **Refund Calculation**: Cancellation refund logic
12. **Advance/Balance Payment**: 25% advance, 75% balance

---

## Database Models

Updated models in `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/db/models.py`:

- **Vehicle** - Fleet with pricing and amenities
- **Customer** - Customer details and authentication
- **Booking** - Trip bookings with pricing breakdown
- **Payment** - Payment transactions
- **VehicleAvailability** - Availability calendar
- **MaintenanceLog** - Vehicle maintenance records
- **Admin** - Admin users
- **ActivityLog** - Admin activity tracking
- **SystemConfig** - Configuration settings
- **PromoCode** - Discount codes
- **PromoCodeUsage** - Promo usage tracking

---

## Next Steps

1. **Prisma Setup**: Run `npx prisma generate` in the project root
2. **Database Migration**: Run `npx prisma db push` to create tables
3. **Dependencies**: Install Python dependencies with `pip install -e .`
4. **Environment**: Configure `.env` file with DATABASE_URL
5. **Run Server**: `uvicorn app.main:app --reload --port 8000`

---

## File Paths Reference

### Main Backend Structure
- **Backend Root**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/`
- **Main App**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/main.py`
- **API Router**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/api.py`

### Endpoint Files
- **Vehicles**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/vehicles.py`
- **Bookings**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/bookings.py`
- **Availability**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/api/v1/endpoints/availability.py`

### Services
- **Pricing**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/services/pricing.py`

### Schemas
- **Vehicle Schemas**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/schemas/vehicle.py`

### Authentication
- **Auth Module**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/core/auth.py`
- **Dependencies**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/app/core/deps.py`

### Documentation
- **API Docs**: `/home/sriharan/Desktop/srirocks/Srirock/Sriharan/POC/Bus_Booking/backend/API_ENDPOINTS.md`
