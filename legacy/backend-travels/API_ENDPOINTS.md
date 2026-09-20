# Bus Booking System API Endpoints

This document describes all the API endpoints available in the Bus Booking System backend.

## Base URL

```
http://localhost:8000/api/v1
```

## Authentication

Most endpoints require authentication via JWT bearer token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Vehicle Endpoints

### List Vehicles

```http
GET /api/v1/vehicles
```

**Query Parameters:**
- `type` (optional): Filter by vehicle type (e.g., CAR_5_SEATER, BUS_52_SEATER)
- `min_capacity` (optional): Minimum seating capacity
- `max_capacity` (optional): Maximum seating capacity
- `min_price` (optional): Minimum price per km
- `max_price` (optional): Maximum price per km
- `amenities` (optional): Comma-separated list of required amenities
- `location` (optional): Filter by location
- `available_only` (default: true): Show only available vehicles
- `page` (default: 1): Page number
- `page_size` (default: 20, max: 100): Items per page
- `sort_by` (default: created_at): Sort field
- `sort_order` (default: desc): Sort order (asc/desc)

**Response:** `VehicleResponse[]`

---

### Get Vehicle by ID

```http
GET /api/v1/vehicles/{vehicle_id}
```

**Response:** `VehicleDetailResponse`

---

### Get Vehicle Categories

```http
GET /api/v1/vehicles/categories
```

**Response:** `VehicleCategory[]`

Returns all vehicle types with display names, descriptions, and typical use cases.

---

### Get Vehicle Types

```http
GET /api/v1/vehicles/types
```

**Response:** `VehicleTypeResponse`

Returns list of available vehicle type codes.

---

### Check Available Vehicles

```http
GET /api/v1/vehicles/available
```

**Query Parameters:**
- `start_date` (required): Start date and time (ISO 8601)
- `end_date` (required): End date and time (ISO 8601)
- `vehicle_type` (optional): Filter by vehicle type
- `min_capacity` (optional): Minimum seating capacity

**Response:** `VehicleResponse[]`

---

### Check Vehicle Availability

```http
POST /api/v1/vehicles/{vehicle_id}/check-availability
```

**Request Body:**
```json
{
  "vehicle_id": "string",
  "start_date": "2024-01-01T10:00:00Z",
  "end_date": "2024-01-03T18:00:00Z"
}
```

**Response:** `VehicleAvailabilityResponse`

---

## Booking Endpoints

### Create Booking

```http
POST /api/v1/bookings
```

**Request Body:**
```json
{
  "vehicle_id": "string",
  "trip_type": "ONE_WAY | ROUND_TRIP | MULTI_CITY",
  "start_date": "2024-01-01T10:00:00Z",
  "end_date": "2024-01-03T18:00:00Z",
  "pickup_location": {
    "address": "string",
    "landmark": "string (optional)",
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "pickup_time": "2024-01-01T10:00:00Z",
  "drop_location": {
    "address": "string",
    "landmark": "string (optional)",
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "return_pickup_location": { ... },
  "return_drop_location": { ... },
  "return_pickup_time": "2024-01-03T10:00:00Z",
  "multi_city_stops": [ ... ],
  "passenger_count": 1,
  "estimated_distance_km": 500,
  "estimated_duration_hours": 10,
  "special_requests": "string (optional)",
  "notes": "string (optional)",
  "promo_code": "string (optional)"
}
```

**Response:** `BookingResponse`

---

### List Bookings

```http
GET /api/v1/bookings
```

**Query Parameters:**
- `customer_id` (optional): Filter by customer ID
- `status` (optional): Filter by booking status
- `vehicle_id` (optional): Filter by vehicle ID
- `date_from` (optional): Filter by start date from
- `date_to` (optional): Filter by start date to
- `page` (default: 1): Page number
- `page_size` (default: 20, max: 100): Items per page

**Response:** `BookingResponse[]`

---

### Get Booking by ID

```http
GET /api/v1/bookings/{booking_id}
```

**Response:** `BookingDetailResponse`

---

### Get Booking by Number

```http
GET /api/v1/bookings/number/{booking_number}
```

**Response:** `BookingDetailResponse`

---

### Update Booking

```http
PUT /api/v1/bookings/{booking_id}
```

**Note:** Only PENDING bookings can be updated.

**Request Body:**
```json
{
  "start_date": "2024-01-01T10:00:00Z (optional)",
  "end_date": "2024-01-03T18:00:00Z (optional)",
  "pickup_location": { ... },
  "pickup_time": "2024-01-01T10:00:00Z (optional)",
  "drop_location": { ... },
  "passenger_count": 2,
  "special_requests": "string (optional)",
  "notes": "string (optional)"
}
```

**Response:** `BookingResponse`

---

### Cancel Booking

```http
PUT /api/v1/bookings/{booking_id}/cancel
```

**Request Body:**
```json
{
  "reason": "Trip cancelled due to emergency (optional)"
}
```

**Response:** `SuccessResponse`

---

### Confirm Booking

```http
PUT /api/v1/bookings/{booking_id}/confirm
```

**Response:** `BookingResponse`

Note: This is typically an admin/driver action.

---

### Complete Booking

```http
PUT /api/v1/bookings/{booking_id}/complete
```

**Response:** `BookingResponse`

Note: This is typically an admin/driver action.

---

### Get Price Estimate

```http
POST /api/v1/bookings/estimate
```

**Request Body:**
```json
{
  "vehicle_id": "string",
  "trip_type": "ONE_WAY | ROUND_TRIP | MULTI_CITY",
  "pickup_location": { ... },
  "drop_location": { ... },
  "return_pickup_location": { ... },
  "return_drop_location": { ... },
  "multi_city_stops": [ ... ],
  "start_date": "2024-01-01T10:00:00Z",
  "end_date": "2024-01-03T18:00:00Z",
  "estimated_distance_km": 500,
  "estimated_duration_hours": 10,
  "passenger_count": 1,
  "include_toll_charges": true,
  "include_parking_charges": false,
  "promo_code": "PROMO123 (optional)"
}
```

**Response:** `PriceEstimateResponse`

---

## Availability Endpoints

### Get Available Vehicles by Date

```http
GET /api/v1/availability/vehicles
```

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `vehicle_type` (optional): Filter by vehicle type
- `min_capacity` (optional): Minimum seating capacity
- `location` (optional): Filter by location
- `group_by_date` (default: true): Group results by date

**Response:** `AvailabilityCheckResponse[]`

---

### Check Specific Vehicle Availability

```http
GET /api/v1/availability/vehicle/{vehicle_id}
```

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `include_bookings` (default: false): Include booking details

**Response:** `VehicleAvailabilityDetail[]`

---

### Block Vehicle Availability

```http
POST /api/v1/availability/vehicle/{vehicle_id}/block
```

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `reason` (required): Reason for blocking
- `is_maintenance` (default: false): Is this a maintenance block

**Response:** Success message

**Note:** This is an admin-only endpoint.

---

### Remove Vehicle Block

```http
DELETE /api/v1/availability/vehicle/{vehicle_id}/block
```

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date

**Response:** Success message

**Note:** This is an admin-only endpoint.

---

### Get Availability Summary

```http
GET /api/v1/availability/summary
```

**Query Parameters:**
- `start_date` (required): Start date
- `end_date` (required): End date
- `group_by_type` (default: true): Group summary by vehicle type

**Response:** Availability summary statistics

---

## Data Models

### Vehicle Types

- `CAR_5_SEATER` - 4-5 passengers (Sedan/Hatchback)
- `CAR_7_SEATER` - 6-7 passengers (SUV/MPV)
- `CAR_9_SEATER` - 8-9 passengers (Large van)
- `TRAVELLER_14_SEATER` - 12-14 passengers (Tempo traveller)
- `COACH_21_SEATER` - 18-21 passengers (Mini coach)
- `COACH_24_SEATER` - 22-24 passengers (Spacious coach)
- `BUS_52_SEATER` - 45-52 passengers (Full-size bus)

### Trip Types

- `ONE_WAY` - Single direction trip
- `ROUND_TRIP` - Return to origin
- `MULTI_CITY` - Multiple stops

### Booking Status

- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Booking confirmed
- `IN_PROGRESS` - Trip in progress
- `COMPLETED` - Trip completed
- `CANCELLED` - Booking cancelled
- `REFUNDED` - Refund processed

### Payment Status

- `PENDING` - Payment pending
- `COMPLETED` - Payment completed
- `FAILED` - Payment failed
- `REFUNDED` - Refund processed
- `PARTIAL` - Partial payment

### Amenities

- `AC`, `NON_AC`
- `WIFI`, `USB_CHARGING`
- `ENTERTAINMENT_SYSTEM`
- `GPS`, `FIRST_AID_KIT`, `FIRE_EXTINGUISHER`
- `REFRIGERATOR`, `RECLINING_SEATS`, `PUSHBACK_SEATS`
- `READING_LIGHTS`, `BLANKETS`, `PILLOWS`
- `WATER_BOTTLES`, `SNACKS`, `LUGGAGE_SPACE`
- `HANDICAP_ACCESSIBLE`, `PASSENGER_DISPLAY`, `MICROPHONE`

---

## Price Calculation

The pricing service calculates the total cost based on:

1. **Base Fare** = Distance (km) × Price per km
2. **Driver Allowance** = Driver allowance per day × Number of days
3. **Toll Charges** = Distance × Toll rate per km (optional)
4. **Parking Charges** = Daily rate × Number of days (optional)
5. **Night Halt Charges** = Applied for multi-day trips
6. **Round Trip Discount** = 10-20% discount for round trips
7. **Service Tax** = 18% GST on subtotal
8. **Promo Discount** = Applied if valid promo code provided

### Minimum Charges

Each vehicle has a minimum charge that applies even if the calculated fare is lower.

### Advance Payment

- 25% of total amount required as advance
- Remaining 75% payable before/during trip

---

## Error Codes

| Code | Description |
|-----|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict (e.g., vehicle already booked) |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database service down |

---

## Running the Backend

```bash
cd backend

# Install dependencies
pip install -e .

# Generate Prisma client
cd ..
npx prisma generate
cd backend

# Run the server
uvicorn app.main:app --reload --port 8000
```

API documentation available at: http://localhost:8000/docs
