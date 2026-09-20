"""Vehicle schemas for request/response validation"""

from pydantic import BaseModel, Field, EmailStr, model_validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal


# ============================================================================
# ENUMS
# ============================================================================

class VehicleTypeEnum(str):
    """Vehicle types matching Prisma schema"""
    CAR_5_SEATER = "CAR_5_SEATER"
    CAR_7_SEATER = "CAR_7_SEATER"
    CAR_9_SEATER = "CAR_9_SEATER"
    TRAVELLER_14_SEATER = "TRAVELLER_14_SEATER"
    COACH_21_SEATER = "COACH_21_SEATER"
    COACH_24_SEATER = "COACH_24_SEATER"
    BUS_52_SEATER = "BUS_52_SEATER"


class TripTypeEnum(str):
    """Trip types matching Prisma schema"""
    ONE_WAY = "ONE_WAY"
    ROUND_TRIP = "ROUND_TRIP"
    MULTI_CITY = "MULTI_CITY"


class BookingStatusEnum(str):
    """Booking statuses matching Prisma schema"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatusEnum(str):
    """Payment statuses matching Prisma schema"""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIAL = "PARTIAL"


class PaymentMethodEnum(str):
    """Payment methods matching Prisma schema"""
    CASH = "CASH"
    CARD = "CARD"
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"


class AmenitiesEnum(str):
    """Available amenities matching Prisma schema"""
    AC = "AC"
    NON_AC = "NON_AC"
    WIFI = "WIFI"
    USB_CHARGING = "USB_CHARGING"
    ENTERTAINMENT_SYSTEM = "ENTERTAINMENT_SYSTEM"
    GPS = "GPS"
    FIRST_AID_KIT = "FIRST_AID_KIT"
    FIRE_EXTINGUISHER = "FIRE_EXTINGUISHER"
    REFRIGERATOR = "REFRIGERATOR"
    RECLINING_SEATS = "RECLINING_SEATS"
    PUSHBACK_SEATS = "PUSHBACK_SEATS"
    READING_LIGHTS = "READING_LIGHTS"
    BLANKETS = "BLANKETS"
    PILLOWS = "PILLOWS"
    WATER_BOTTLES = "WATER_BOTTLES"
    SNACKS = "SNACKS"
    LUGGAGE_SPACE = "LUGGAGE_SPACE"
    HANDICAP_ACCESSIBLE = "HANDICAP_ACCESSIBLE"
    PASSENGER_DISPLAY = "PASSENGER_DISPLAY"
    MICROPHONE = "MICROPHONE"


# ============================================================================
# VEHICLE SCHEMAS
# ============================================================================

class VehicleFilterParams(BaseModel):
    """Vehicle filter parameters"""
    type: Optional[str] = None
    min_capacity: Optional[int] = None
    max_capacity: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    amenities: Optional[List[str]] = None
    location: Optional[str] = None
    available_only: bool = True
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class VehicleBase(BaseModel):
    """Base vehicle schema"""
    registration_number: str
    name: str
    type: str
    seating_capacity: int
    price_per_km: Decimal
    minimum_charge: Decimal
    driver_allowance_per_day: Decimal
    minimum_days: int = 1
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    fuel_type: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class VehicleResponse(VehicleBase):
    """Vehicle response schema"""
    id: str
    is_available: bool
    amenities: List[str]
    images: List[str]
    thumbnail_image: Optional[str] = None
    rating: Decimal
    review_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class VehicleDetailResponse(VehicleResponse):
    """Detailed vehicle response with maintenance info"""
    features: Optional[Dict[str, Any]] = None
    last_service_date: Optional[datetime] = None
    next_service_due: Optional[datetime] = None
    insurance_expiry: Optional[datetime] = None


class VehicleCategory(BaseModel):
    """Vehicle category response"""
    type: str
    display_name: str
    description: str
    capacity_range: str
    typical_uses: List[str]


class VehicleTypeResponse(BaseModel):
    """Vehicle type response"""
    types: List[str]


class VehicleAvailabilityRequest(BaseModel):
    """Vehicle availability check request"""
    vehicle_id: str
    start_date: datetime
    end_date: datetime


class VehicleAvailabilityResponse(BaseModel):
    """Vehicle availability response"""
    vehicle_id: str
    is_available: bool
    available_dates: List[Dict[str, Any]]
    blocked_dates: List[Dict[str, Any]]


# ============================================================================
# CUSTOMER SCHEMAS
# ============================================================================

class CustomerBase(BaseModel):
    """Base customer schema"""
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    alternate_phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    """Customer creation schema"""
    password: str
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str = "India"


class CustomerResponse(CustomerBase):
    """Customer response schema"""
    id: str
    is_verified: bool
    is_corporate: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerProfileResponse(CustomerResponse):
    """Extended customer profile response"""
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    company_name: Optional[str] = None
    company_gst: Optional[str] = None
    company_address: Optional[str] = None


# ============================================================================
# BOOKING SCHEMAS
# ============================================================================

class LocationInfo(BaseModel):
    """Location information"""
    address: str
    landmark: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None


class MultiCityStop(BaseModel):
    """Multi-city stop information"""
    location: str
    landmark: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    time: Optional[datetime] = None
    distance_from_previous: Optional[Decimal] = None


class BookingCreate(BaseModel):
    """Booking creation schema"""
    customer_id: Optional[str] = None  # Optional if using authenticated user
    vehicle_id: str
    trip_type: str
    start_date: datetime
    end_date: Optional[datetime] = None
    pickup_location: LocationInfo
    pickup_time: datetime
    drop_location: LocationInfo
    return_pickup_location: Optional[LocationInfo] = None
    return_drop_location: Optional[LocationInfo] = None
    return_pickup_time: Optional[datetime] = None
    multi_city_stops: Optional[List[MultiCityStop]] = None
    passenger_count: int = Field(default=1, ge=1)
    estimated_distance_km: Optional[Decimal] = None
    estimated_duration_hours: Optional[Decimal] = None
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    promo_code: Optional[str] = None
    # Phone-based booking - REQUIRED when customer_id is not provided
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None  # Phone number is required for guest bookings
    contact_email: Optional[EmailStr] = None  # Email is optional
    captcha_token: Optional[str] = None  # For captcha verification

    # Validation to ensure either customer_id or contact phone is provided
    @model_validator(mode='after')
    def check_customer_or_contact(self):
        if not self.customer_id and not self.contact_phone:
            raise ValueError("Either customer_id (for authenticated users) or contact_phone (for guest bookings) must be provided")
        return self


class BookingResponse(BaseModel):
    """Booking response schema"""
    id: str
    booking_number: str
    customer_id: str
    vehicle_id: str
    trip_type: str
    start_date: datetime
    end_date: Optional[datetime] = None
    pickup_location: str
    pickup_landmark: Optional[str] = None
    pickup_lat: Optional[Decimal] = None
    pickup_lng: Optional[Decimal] = None
    pickup_time: datetime
    drop_location: str
    drop_landmark: Optional[str] = None
    drop_lat: Optional[Decimal] = None
    drop_lng: Optional[Decimal] = None
    passenger_count: int
    estimated_distance_km: Optional[Decimal] = None
    estimated_duration_hours: Optional[Decimal] = None
    base_fare: Decimal
    distance_charge: Decimal
    driver_allowance: Decimal
    toll_charges: Decimal
    parking_charges: Decimal
    night_halt_charges: Decimal
    service_tax: Decimal
    discount: Decimal
    total_amount: Decimal
    advance_paid: Decimal
    balance_amount: Decimal
    status: str
    payment_status: str
    payment_due_amount: Decimal
    payment_due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BookingDetailResponse(BookingResponse):
    """Detailed booking response"""
    vehicle: Optional[VehicleDetailResponse] = None
    customer: Optional[CustomerResponse] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    special_requests: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    cancelled_by: Optional[str] = None
    return_pickup_location: Optional[str] = None
    return_drop_location: Optional[str] = None
    return_pickup_time: Optional[datetime] = None
    multi_city_stops: Optional[str] = None


class BookingUpdate(BaseModel):
    """Booking update schema"""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    pickup_location: Optional[LocationInfo] = None
    pickup_time: Optional[datetime] = None
    drop_location: Optional[LocationInfo] = None
    passenger_count: Optional[int] = Field(default=None, ge=1)
    special_requests: Optional[str] = None
    notes: Optional[str] = None


class BookingStatusUpdate(BaseModel):
    """Booking status update schema"""
    status: Optional[str] = None
    reason: Optional[str] = None


# ============================================================================
# PRICING SCHEMAS
# ============================================================================

class PriceEstimateRequest(BaseModel):
    """Price estimate request"""
    vehicle_id: str
    trip_type: str = TripTypeEnum.ONE_WAY
    pickup_location: LocationInfo
    drop_location: LocationInfo
    return_pickup_location: Optional[LocationInfo] = None
    return_drop_location: Optional[LocationInfo] = None
    multi_city_stops: Optional[List[MultiCityStop]] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    estimated_distance_km: Decimal
    estimated_duration_hours: Optional[Decimal] = None
    passenger_count: int = Field(default=1, ge=1)
    include_toll_charges: bool = True
    include_parking_charges: bool = False
    promo_code: Optional[str] = None


class PriceEstimateResponse(BaseModel):
    """Price estimate response"""
    vehicle_id: str
    vehicle_name: str
    trip_type: str
    base_fare: Decimal
    distance_charge: Decimal
    driver_allowance: Decimal
    toll_charges: Decimal
    parking_charges: Decimal
    night_halt_charges: Decimal
    subtotal: Decimal
    service_tax: Decimal
    discount: Decimal
    discount_applied: Optional[str] = None
    total_amount: Decimal
    minimum_guarantee: Decimal
    advance_required: Decimal
    balance_payable: Decimal
    breakdown: Dict[str, Any]


class PaymentCreate(BaseModel):
    """Payment creation schema"""
    booking_id: str
    amount: Decimal
    payment_method: str
    transaction_ref: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response schema"""
    id: str
    transaction_id: str
    booking_id: str
    amount: Decimal
    payment_method: str
    status: str
    transaction_date: datetime
    gateway_name: Optional[str] = None
    gateway_transaction_id: Optional[str] = None

    class Config:
        from_attributes = True


# ============================================================================
# AVAILABILITY SCHEMAS
# ============================================================================

class AvailabilityCheckRequest(BaseModel):
    """Availability check request"""
    start_date: datetime
    end_date: datetime
    vehicle_type: Optional[str] = None
    min_capacity: Optional[int] = None
    location: Optional[str] = None


class AvailabilityCheckResponse(BaseModel):
    """Availability check response"""
    date: datetime
    available_vehicles: int
    total_vehicles: int
    vehicles: List[VehicleResponse]


class VehicleAvailabilityDetail(BaseModel):
    """Vehicle availability detail"""
    vehicle_id: str
    date: datetime
    start_time: str
    end_time: str
    is_available: bool
    booking_id: Optional[str] = None
    is_maintenance: bool = False
    maintenance_reason: Optional[str] = None


# ============================================================================
# COMMON SCHEMAS
# ============================================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Dict[str, Any]]
    total: int
    page: int
    page_size: int
    total_pages: int
