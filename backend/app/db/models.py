"""Database models aligned with Prisma schema"""

from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, DateTime, Numeric, Boolean, ForeignKey, Enum, Text, JSON, ARRAY
)
from sqlalchemy.orm import relationship, declarative_base
import enum
import uuid

Base = declarative_base()


def generate_uuid():
    return str(uuid.uuid4())


# ============================================================================
# ENUMS
# ============================================================================

class VehicleType(str, enum.Enum):
    """Vehicle types matching Prisma schema"""
    CAR_5_SEATER = "CAR_5_SEATER"
    CAR_7_SEATER = "CAR_7_SEATER"
    CAR_9_SEATER = "CAR_9_SEATER"
    TRAVELLER_14_SEATER = "TRAVELLER_14_SEATER"
    COACH_21_SEATER = "COACH_21_SEATER"
    COACH_24_SEATER = "COACH_24_SEATER"
    BUS_52_SEATER = "BUS_52_SEATER"


class BookingStatus(str, enum.Enum):
    """Booking statuses matching Prisma schema"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"


class PaymentStatus(str, enum.Enum):
    """Payment statuses matching Prisma schema"""
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    PARTIAL = "PARTIAL"


class PaymentMethod(str, enum.Enum):
    """Payment methods matching Prisma schema"""
    CASH = "CASH"
    CARD = "CARD"
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"


class TripType(str, enum.Enum):
    """Trip types matching Prisma schema"""
    ONE_WAY = "ONE_WAY"
    ROUND_TRIP = "ROUND_TRIP"
    MULTI_CITY = "MULTI_CITY"


# ============================================================================
# MODELS
# ============================================================================

class Vehicle(Base):
    """Vehicle fleet with various seating capacities and amenities"""
    __tablename__ = "vehicles"

    id = Column(String, primary_key=True, default=generate_uuid)
    registration_number = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(VehicleType), nullable=False)
    seating_capacity = Column(Integer, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    # Pricing structure (in INR)
    price_per_km = Column(Numeric(10, 2), nullable=False)
    minimum_charge = Column(Numeric(10, 2), nullable=False)
    driver_allowance_per_day = Column(Numeric(10, 2), nullable=False)
    minimum_days = Column(Integer, default=1, nullable=False)

    # Vehicle details
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    fuel_type = Column(String)  # PETROL, DIESEL, CNG, ELECTRIC
    color = Column(String)

    # Amenities available (stored as JSON array)
    amenities = Column(JSON, default=list, nullable=False)

    # Images (stored as JSON array)
    images = Column(JSON, default=list, nullable=False)
    thumbnail_image = Column(String)

    # Additional details
    description = Column(Text)
    features = Column(Text)  # JSON for additional features

    # Maintenance
    last_service_date = Column(DateTime)
    next_service_due = Column(DateTime)
    insurance_expiry = Column(DateTime)
    pollution_cert_expiry = Column(DateTime)
    fitness_cert_expiry = Column(DateTime)

    # Rating and reviews
    rating = Column(Numeric(3, 2), default=0, nullable=False)
    review_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    bookings = relationship("Booking", back_populates="vehicle", cascade="all, delete-orphan")
    availabilities = relationship("VehicleAvailability", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")


class Customer(Base):
    """Customer details for bookings"""
    __tablename__ = "customers"

    id = Column(String, primary_key=True, default=generate_uuid)

    # Personal information
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    alternate_phone = Column(String)

    # Address
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state = Column(String)
    postal_code = Column(String)
    country = Column(String, default="India", nullable=False)

    # KYC details
    id_type = Column(String)  # AADHAR, PASSPORT, DRIVING_LICENSE, PAN
    id_number = Column(String)
    id_proof_url = Column(String)

    # Company details for corporate bookings
    company_name = Column(String)
    company_gst = Column(String)
    company_address = Column(Text)

    # Authentication
    password_hash = Column(String)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_corporate = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime)

    # Relations
    bookings = relationship("Booking", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")


class Booking(Base):
    """Booking details for trips"""
    __tablename__ = "bookings"

    id = Column(String, primary_key=True, default=generate_uuid)
    booking_number = Column(String, unique=True, nullable=False, index=True)

    # Relations
    customer_id = Column(String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    customer = relationship("Customer", back_populates="bookings")

    vehicle_id = Column(String, ForeignKey("vehicles.id"), nullable=False)
    vehicle = relationship("Vehicle", back_populates="bookings")

    driver_id = Column(String)  # Can link to Driver model if needed

    # Trip details
    trip_type = Column(Enum(TripType), nullable=False)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)

    # Route details (stored as JSON for flexibility)
    pickup_location = Column(Text, nullable=False)
    pickup_landmark = Column(String)
    pickup_lat = Column(Numeric(10, 8))
    pickup_lng = Column(Numeric(11, 8))
    pickup_time = Column(DateTime, nullable=False)

    drop_location = Column(Text, nullable=False)
    drop_landmark = Column(String)
    drop_lat = Column(Numeric(10, 8))
    drop_lng = Column(Numeric(11, 8))

    # For round-trip and multi-city
    return_pickup_location = Column(Text)
    return_drop_location = Column(Text)
    return_pickup_time = Column(DateTime)

    # Multi-city stops (JSON array of stops)
    multi_city_stops = Column(Text)  # JSON: [{location, landmark, lat, lng, time}]

    # Distance and duration estimates
    estimated_distance_km = Column(Numeric(10, 2))
    estimated_duration_hours = Column(Numeric(10, 2))

    # Passenger count
    passenger_count = Column(Integer, default=1, nullable=False)

    # Pricing details (in INR)
    base_fare = Column(Numeric(10, 2), nullable=False)
    distance_charge = Column(Numeric(10, 2), default=0, nullable=False)
    driver_allowance = Column(Numeric(10, 2), default=0, nullable=False)
    toll_charges = Column(Numeric(10, 2), default=0, nullable=False)
    parking_charges = Column(Numeric(10, 2), default=0, nullable=False)
    night_halt_charges = Column(Numeric(10, 2), default=0, nullable=False)
    service_tax = Column(Numeric(10, 2), default=0, nullable=False)
    discount = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    advance_paid = Column(Numeric(10, 2), default=0, nullable=False)
    balance_amount = Column(Numeric(10, 2), nullable=False)

    # Booking status
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    # Additional details
    special_requests = Column(Text)
    notes = Column(Text)
    cancellation_reason = Column(Text)
    cancelled_at = Column(DateTime)
    cancelled_by = Column(String)  # CUSTOMER, ADMIN, SYSTEM

    # Driver details (assigned driver)
    driver_name = Column(String)
    driver_phone = Column(String)

    # Payment tracking
    payment_due_amount = Column(Numeric(10, 2), nullable=False)
    payment_due_date = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime)
    completed_at = Column(DateTime)

    # Relations
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")


class Payment(Base):
    """Payment transactions"""
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_id = Column(String, unique=True, nullable=False)

    # Relations
    booking_id = Column(String, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    booking = relationship("Booking", back_populates="payments")

    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    customer = relationship("Customer", back_populates="payments")

    # Payment details
    amount = Column(Numeric(10, 2), nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)

    # Transaction details
    transaction_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    transaction_ref = Column(String)  # Bank reference, UPI ref, etc.

    # Gateway details
    gateway_name = Column(String)  # RAZORPAY, STRIPE, PAYTM, etc.
    gateway_transaction_id = Column(String)
    gateway_response = Column(Text)  # JSON response

    # Refund details
    refund_amount = Column(Numeric(10, 2))
    refund_reason = Column(String)
    refund_date = Column(DateTime)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)

    # Additional info
    notes = Column(Text)


class VehicleAvailability(Base):
    """Vehicle availability calendar for optimization"""
    __tablename__ = "vehicle_availabilities"

    id = Column(String, primary_key=True, default=generate_uuid)

    vehicle_id = Column(String, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    vehicle = relationship("Vehicle", back_populates="availabilities")

    # Date range
    date = Column(DateTime, nullable=False)
    start_time = Column(String, nullable=False)  # HH:MM format
    end_time = Column(String, nullable=False)  # HH:MM format

    # Availability status
    is_available = Column(Boolean, default=True, nullable=False)

    # Booking details (if booked)
    booking_id = Column(String)  # Reference to booking if booked

    # Location details
    current_location = Column(String)
    current_lat = Column(Numeric(10, 8))
    current_lng = Column(Numeric(11, 8))

    # Maintenance block
    is_maintenance = Column(Boolean, default=False, nullable=False)
    maintenance_reason = Column(String)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class MaintenanceLog(Base):
    """Maintenance logs for vehicles"""
    __tablename__ = "maintenance_logs"

    id = Column(String, primary_key=True, default=generate_uuid)

    vehicle_id = Column(String, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    vehicle = relationship("Vehicle", back_populates="maintenance_logs")

    # Maintenance details
    type = Column(String, nullable=False)  # SERVICE, REPAIR, INSPECTION, BREAKDOWN
    description = Column(Text, nullable=False)
    cost = Column(Numeric(10, 2))

    # Dates
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    end_date = Column(DateTime)
    completed_at = Column(DateTime)

    # Service center details
    service_provider = Column(String)
    service_provider_phone = Column(String)
    invoice_number = Column(String)

    # Status
    status = Column(String, default="PENDING", nullable=False)  # PENDING, IN_PROGRESS, COMPLETED, CANCELLED

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Performed by
    performed_by = Column(String)  # Admin or technician name


class Admin(Base):
    """Admin users for dashboard access"""
    __tablename__ = "admins"

    id = Column(String, primary_key=True, default=generate_uuid)

    # Credentials
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    username = Column(String, unique=True)

    # Personal info
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    phone = Column(String)

    # Role and permissions
    role = Column(String, default="ADMIN", nullable=False)  # ADMIN, SUPER_ADMIN, STAFF
    permissions = Column(JSON, default=list, nullable=False)  # Array of permission strings

    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_super_admin = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column(DateTime)
    last_login_ip = Column(String)

    # Activity logs
    activity_logs = relationship("ActivityLog", back_populates="admin", cascade="all, delete-orphan")


class ActivityLog(Base):
    """Activity logs for admin actions"""
    __tablename__ = "activity_logs"

    id = Column(String, primary_key=True, default=generate_uuid)

    admin_id = Column(String, ForeignKey("admins.id"), nullable=False)
    admin = relationship("Admin", back_populates="activity_logs")

    action = Column(String, nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    entity = Column(String, nullable=False)  # BOOKING, VEHICLE, CUSTOMER, etc.
    entity_id = Column(String)
    description = Column(Text, nullable=False)

    # Request details
    ip_address = Column(String)
    user_agent = Column(Text)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class SystemConfig(Base):
    """Configuration and settings"""
    __tablename__ = "system_configs"

    id = Column(String, primary_key=True, default=generate_uuid)
    key = Column(String, unique=True, nullable=False)
    value = Column(Text, nullable=False)
    description = Column(Text)
    category = Column(String)  # PRICING, BOOKING, PAYMENT, NOTIFICATION, etc.

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PromoCode(Base):
    """Promo codes and discounts"""
    __tablename__ = "promo_codes"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    description = Column(String)

    # Discount details
    discount_type = Column(String, nullable=False)  # PERCENTAGE, FIXED_AMOUNT
    discount_value = Column(Numeric(10, 2), nullable=False)
    max_discount_amount = Column(Numeric(10, 2))
    min_booking_amount = Column(Numeric(10, 2))

    # Applicability
    applicable_vehicle_types = Column(JSON, default=list, nullable=False)
    applicable_trip_types = Column(JSON, default=list, nullable=False)

    # Validity
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)

    # Usage limits
    max_uses = Column(Integer)  # null = unlimited
    used_count = Column(Integer, default=0, nullable=False)
    max_uses_per_user = Column(Integer)  # null = unlimited

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    usages = relationship("PromoCodeUsage", back_populates="promo_code", cascade="all, delete-orphan")


class PromoCodeUsage(Base):
    """Promo code usage tracking"""
    __tablename__ = "promo_code_usages"

    id = Column(String, primary_key=True, default=generate_uuid)

    promo_code_id = Column(String, ForeignKey("promo_codes.id", ondelete="CASCADE"), nullable=False)
    promo_code = relationship("PromoCode", back_populates="usages")

    booking_id = Column(String, nullable=False)
    customer_id = Column(String, nullable=False)

    discount_applied = Column(Numeric(10, 2), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
