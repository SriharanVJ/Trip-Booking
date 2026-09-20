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

    id = Column("id", String, primary_key=True, default=generate_uuid)
    registrationNumber = Column("registrationNumber", String, unique=True, nullable=False)
    name = Column("name", String, nullable=False)
    type = Column("type", Enum(VehicleType, name="VehicleType", create_constraint=False, inherit_schema=True), nullable=False)
    seatingCapacity = Column("seatingCapacity", Integer, nullable=False)
    isAvailable = Column("isAvailable", Boolean, default=True, nullable=False)

    # Pricing structure (in INR)
    pricePerKm = Column("pricePerKm", Numeric(10, 2), nullable=False)
    pricePerDay = Column("pricePerDay", Numeric(10, 2), nullable=False)
    minimumCharge = Column("minimumCharge", Numeric(10, 2), nullable=False)
    driverAllowancePerDay = Column("driverAllowancePerDay", Numeric(10, 2), nullable=False)
    minimumDays = Column("minimumDays", Integer, default=1, nullable=False)

    # Vehicle details
    make = Column("make", String)
    model = Column("model", String)
    year = Column("year", Integer)
    fuelType = Column("fuelType", String)  # PETROL, DIESEL, CNG, ELECTRIC
    color = Column("color", String)

    # Amenities available (stored as JSON array)
    amenities = Column("amenities", JSON, default=list, nullable=False)

    # Images (stored as JSON array)
    images = Column("images", JSON, default=list, nullable=False)
    thumbnailImage = Column("thumbnailImage", String)

    # Additional details
    description = Column("description", Text)
    features = Column("features", JSON)  # JSON for additional features

    # Maintenance
    lastServiceDate = Column("lastServiceDate", DateTime)
    nextServiceDue = Column("nextServiceDue", DateTime)
    insuranceExpiry = Column("insuranceExpiry", DateTime)
    pollutionCertExpiry = Column("pollutionCertExpiry", DateTime)
    fitnessCertExpiry = Column("fitnessCertExpiry", DateTime)

    # Rating and reviews
    rating = Column("rating", Numeric(3, 2), default=0, nullable=False)
    reviewCount = Column("reviewCount", Integer, default=0, nullable=False)

    # Timestamps
    createdAt = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relations
    bookings = relationship("Booking", back_populates="vehicle", cascade="all, delete-orphan")
    availabilities = relationship("VehicleAvailability", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_logs = relationship("MaintenanceLog", back_populates="vehicle", cascade="all, delete-orphan")


class Customer(Base):
    """Customer details for bookings"""
    __tablename__ = "customers"

    id = Column("id", String, primary_key=True, default=generate_uuid)

    # Personal information (database columns are camelCase)
    first_name = Column("firstName", String, nullable=False)
    last_name = Column("lastName", String, nullable=False)
    email = Column("email", String, unique=True, nullable=False, index=True)
    phone = Column("phone", String, nullable=False)
    alternate_phone = Column("alternatePhone", String)

    # Address (database columns are camelCase)
    address_line1 = Column("addressLine1", String)
    address_line2 = Column("addressLine2", String)
    city = Column("city", String)
    state = Column("state", String)
    postal_code = Column("postalCode", String)
    country = Column("country", String, default="India", nullable=False)

    # KYC details (database columns are camelCase)
    id_type = Column("idType", String)  # AADHAR, PASSPORT, DRIVING_LICENSE, PAN
    id_number = Column("idNumber", String)
    id_proof_url = Column("idProofUrl", String)

    # Company details for corporate bookings (database columns are camelCase)
    company_name = Column("companyName", String)
    company_gst = Column("companyGst", String)
    company_address = Column("companyAddress", Text)

    # Authentication (database columns are camelCase) - password optional for phone-based auth
    password_hash = Column("passwordHash", String, nullable=True)
    is_verified = Column("isVerified", Boolean, default=False, nullable=False)
    is_corporate = Column("isCorporate", Boolean, default=False, nullable=False)

    # Timestamps (database columns are camelCase)
    created_at = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_login_at = Column("lastLoginAt", DateTime)

    # Relations
    bookings = relationship("Booking", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")


class Booking(Base):
    """Booking details for trips"""
    __tablename__ = "bookings"

    id = Column("id", String, primary_key=True, default=generate_uuid)
    bookingNumber = Column("bookingNumber", String, unique=True, nullable=False, index=True)

    # Relations
    customerId = Column("customerId", String, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    customer = relationship("Customer", back_populates="bookings")

    vehicleId = Column("vehicleId", String, ForeignKey("vehicles.id"), nullable=False)
    vehicle = relationship("Vehicle", back_populates="bookings")

    driverId = Column("driverId", String)  # Can link to Driver model if needed

    # Trip details
    tripType = Column("tripType", Enum(TripType, name="TripType", values_callable=lambda x: [e.value for e in x]), nullable=False)
    startDate = Column("startDate", DateTime, nullable=False)
    endDate = Column("endDate", DateTime)

    # Route details (stored as JSON for flexibility)
    pickupLocation = Column("pickupLocation", Text, nullable=False)
    pickupLandmark = Column("pickupLandmark", String)
    pickupLat = Column("pickupLat", Numeric(10, 8))
    pickupLng = Column("pickupLng", Numeric(11, 8))
    pickupTime = Column("pickupTime", DateTime, nullable=False)

    dropLocation = Column("dropLocation", Text, nullable=False)
    dropLandmark = Column("dropLandmark", String)
    dropLat = Column("dropLat", Numeric(10, 8))
    dropLng = Column("dropLng", Numeric(11, 8))

    # For round-trip and multi-city
    returnPickupLocation = Column("returnPickupLocation", Text)
    returnDropLocation = Column("returnDropLocation", Text)
    returnPickupTime = Column("returnPickupTime", DateTime)

    # Multi-city stops (JSON array of stops)
    multiCityStops = Column("multiCityStops", Text)  # JSON: [{location, landmark, lat, lng, time}]

    # Distance and duration estimates
    estimatedDistanceKm = Column("estimatedDistanceKm", Numeric(10, 2))
    estimatedDurationHours = Column("estimatedDurationHours", Numeric(10, 2))

    # Passenger count
    passengerCount = Column("passengerCount", Integer, default=1, nullable=False)

    # Pricing details (in INR)
    baseFare = Column("baseFare", Numeric(10, 2), nullable=False)
    distanceCharge = Column("distanceCharge", Numeric(10, 2), default=0, nullable=False)
    driverAllowance = Column("driverAllowance", Numeric(10, 2), default=0, nullable=False)
    tollCharges = Column("tollCharges", Numeric(10, 2), default=0, nullable=False)
    parkingCharges = Column("parkingCharges", Numeric(10, 2), default=0, nullable=False)
    nightHaltCharges = Column("nightHaltCharges", Numeric(10, 2), default=0, nullable=False)
    serviceTax = Column("serviceTax", Numeric(10, 2), default=0, nullable=False)
    discount = Column("discount", Numeric(10, 2), default=0, nullable=False)
    totalAmount = Column("totalAmount", Numeric(10, 2), nullable=False)
    advancePaid = Column("advancePaid", Numeric(10, 2), default=0, nullable=False)
    balanceAmount = Column("balanceAmount", Numeric(10, 2), nullable=False)

    # Booking status
    status = Column("status", Enum(BookingStatus, name="BookingStatus", values_callable=lambda x: [e.value for e in x]), default=BookingStatus.PENDING, nullable=False)
    paymentStatus = Column("paymentStatus", Enum(PaymentStatus, name="PaymentStatus", values_callable=lambda x: [e.value for e in x]), default=PaymentStatus.PENDING, nullable=False)

    # Additional details
    specialRequests = Column("specialRequests", Text)
    notes = Column("notes", Text)
    cancellationReason = Column("cancellationReason", Text)
    cancelledAt = Column("cancelledAt", DateTime)
    cancelledBy = Column("cancelledBy", String)  # CUSTOMER, ADMIN, SYSTEM

    # Driver details (assigned driver)
    driverName = Column("driverName", String)
    driverPhone = Column("driverPhone", String)

    # Payment tracking
    paymentDueAmount = Column("paymentDueAmount", Numeric(10, 2), nullable=False)
    paymentDueDate = Column("paymentDueDate", DateTime)

    # Timestamps
    createdAt = Column("createdAt", DateTime, default=datetime.utcnow, nullable=False)
    updatedAt = Column("updatedAt", DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    confirmedAt = Column("confirmedAt", DateTime)
    completedAt = Column("completedAt", DateTime)

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
