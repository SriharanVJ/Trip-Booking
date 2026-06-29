"""Database CRUD operations"""

from typing import Optional, List
from uuid import uuid4
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Customer, Vehicle, Booking, Admin, Payment, VehicleAvailability, BookingStatus, VehicleType, TripType
from app.core.security import get_password_hash, verify_password


# ============================================================================
# CUSTOMER CRUD
# ============================================================================

async def get_customer_by_id(db: AsyncSession, customer_id: str) -> Optional[Customer]:
    """Get customer by ID"""
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    return result.scalar_one_or_none()


async def get_customer_by_email(db: AsyncSession, email: str) -> Optional[Customer]:
    """Get customer by email"""
    result = await db.execute(select(Customer).where(Customer.email == email))
    return result.scalar_one_or_none()


async def create_customer(
    db: AsyncSession,
    first_name: str,
    last_name: str,
    email: str,
    phone: str,
    password: str | None = None,
    is_corporate: bool = False
) -> Customer:
    """Create a new customer (password optional for phone-based auth)"""
    customer = Customer(
        id=str(uuid4()),
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        password_hash=get_password_hash(password) if password else None,
        is_corporate=is_corporate,
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


async def get_customer_by_phone(db: AsyncSession, phone: str) -> Optional[Customer]:
    """Get customer by phone number"""
    result = await db.execute(select(Customer).where(Customer.phone == phone))
    return result.scalar_one_or_none()


async def authenticate_customer(db: AsyncSession, email: str, password: str) -> Optional[Customer]:
    """Authenticate customer credentials"""
    customer = await get_customer_by_email(db, email)
    if not customer or not customer.password_hash:
        return None
    if not verify_password(password, customer.password_hash):
        return None
    return customer


async def update_customer_login(db: AsyncSession, customer: Customer):
    """Update customer last login time"""
    from datetime import datetime
    from sqlalchemy import func
    customer.last_login_at = datetime.utcnow()
    await db.commit()


# ============================================================================
# ADMIN CRUD
# ============================================================================

async def get_admin_by_id(db: AsyncSession, admin_id: str) -> Optional[Admin]:
    """Get admin by ID"""
    result = await db.execute(select(Admin).where(Admin.id == admin_id))
    return result.scalar_one_or_none()


async def get_admin_by_email(db: AsyncSession, email: str) -> Optional[Admin]:
    """Get admin by email"""
    result = await db.execute(select(Admin).where(Admin.email == email))
    return result.scalar_one_or_none()


async def authenticate_admin(db: AsyncSession, email: str, password: str) -> Optional[Admin]:
    """Authenticate admin credentials"""
    admin = await get_admin_by_email(db, email)
    if not admin or not admin.password_hash:
        return None
    if not verify_password(password, admin.password_hash):
        return None
    if not admin.is_active:
        return None
    return admin


# ============================================================================
# VEHICLE CRUD
# ============================================================================

async def get_vehicles(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    vehicle_type: Optional[VehicleType] = None,
    available_only: bool = True
) -> List[Vehicle]:
    """Get vehicles with optional filters, sorted by price per km ascending"""
    from sqlalchemy import asc

    query = select(Vehicle)

    if available_only:
        query = query.where(Vehicle.isAvailable == True)

    if vehicle_type:
        query = query.where(Vehicle.type == vehicle_type)

    # Sort by price per km in ascending order
    query = query.order_by(asc(Vehicle.pricePerKm))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_vehicle_by_id(db: AsyncSession, vehicle_id: str) -> Optional[Vehicle]:
    """Get vehicle by ID"""
    result = await db.execute(select(Vehicle).where(Vehicle.id == vehicle_id))
    return result.scalar_one_or_none()


async def get_vehicle_by_registration(db: AsyncSession, registration_number: str) -> Optional[Vehicle]:
    """Get vehicle by registration number"""
    result = await db.execute(
        select(Vehicle).where(Vehicle.registrationNumber == registration_number)
    )
    return result.scalar_one_or_none()


async def create_vehicle(
    db: AsyncSession,
    registration_number: str,
    name: str,
    vehicle_type: VehicleType,
    seating_capacity: int,
    price_per_km: float,
    minimum_charge: float,
    driver_allowance_per_day: float,
    make: Optional[str] = None,
    model: Optional[str] = None,
    year: Optional[int] = None,
    fuel_type: Optional[str] = None,
    color: Optional[str] = None,
    amenities: Optional[List[str]] = None,
    images: Optional[List[str]] = None,
    description: Optional[str] = None
) -> Vehicle:
    """Create a new vehicle"""
    vehicle = Vehicle(
        id=str(uuid4()),
        registrationNumber=registration_number,
        name=name,
        type=vehicle_type,
        seatingCapacity=seating_capacity,
        pricePerKm=price_per_km,
        minimumCharge=minimum_charge,
        driverAllowancePerDay=driver_allowance_per_day,
        make=make,
        model=model,
        year=year,
        fuelType=fuel_type,
        color=color,
        amenities=amenities or [],
        images=images or [],
        description=description,
    )
    db.add(vehicle)
    await db.commit()
    await db.refresh(vehicle)
    return vehicle


async def update_vehicle_availability(
    db: AsyncSession,
    vehicle_id: str,
    is_available: bool
) -> Optional[Vehicle]:
    """Update vehicle availability status"""
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if vehicle:
        vehicle.isAvailable = is_available
        await db.commit()
        await db.refresh(vehicle)
    return vehicle


async def delete_vehicle(db: AsyncSession, vehicle_id: str) -> bool:
    """Delete a vehicle"""
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if vehicle:
        await db.delete(vehicle)
        await db.commit()
        return True
    return False


async def get_available_vehicles(
    db: AsyncSession,
    vehicle_type: Optional[VehicleType] = None,
    min_capacity: Optional[int] = None
) -> List[Vehicle]:
    """Get available vehicles with filters"""
    query = select(Vehicle).where(Vehicle.isAvailable == True)

    if vehicle_type:
        query = query.where(Vehicle.type == vehicle_type)

    if min_capacity:
        query = query.where(Vehicle.seatingCapacity >= min_capacity)

    result = await db.execute(query)
    return list(result.scalars().all())


# ============================================================================
# BOOKING CRUD
# ============================================================================

async def get_bookings(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 100,
    customer_id: Optional[str] = None,
    status: Optional[BookingStatus] = None,
    vehicle_id: Optional[str] = None
) -> List[Booking]:
    """Get bookings with optional filters"""
    query = select(Booking)

    if customer_id:
        query = query.where(Booking.customerId == customer_id)

    if status:
        query = query.where(Booking.status == status)

    if vehicle_id:
        query = query.where(Booking.vehicleId == vehicle_id)

    query = query.order_by(Booking.createdAt.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_booking_by_id(db: AsyncSession, booking_id: str) -> Optional[Booking]:
    """Get booking by ID"""
    result = await db.execute(select(Booking).where(Booking.id == booking_id))
    return result.scalar_one_or_none()


async def get_booking_by_number(db: AsyncSession, booking_number: str) -> Optional[Booking]:
    """Get booking by booking number"""
    result = await db.execute(
        select(Booking).where(Booking.bookingNumber == booking_number)
    )
    return result.scalar_one_or_none()


async def create_booking(
    db: AsyncSession,
    customer_id: str,
    vehicle_id: str,
    trip_type: str,
    start_date,
    pickup_location: str,
    pickup_time,
    drop_location: str,
    end_date=None,
    pickup_landmark: Optional[str] = None,
    drop_landmark: Optional[str] = None,
    pickup_lat: Optional[float] = None,
    pickup_lng: Optional[float] = None,
    drop_lat: Optional[float] = None,
    drop_lng: Optional[float] = None,
    return_pickup_location: Optional[str] = None,
    return_drop_location: Optional[str] = None,
    return_pickup_time=None,
    multi_city_stops: Optional[str] = None,
    estimated_distance_km: Optional[float] = None,
    estimated_duration_hours: Optional[float] = None,
    passenger_count: int = 1,
    base_fare: float = 0,
    distance_charge: float = 0,
    driver_allowance: float = 0,
    toll_charges: float = 0,
    parking_charges: float = 0,
    night_halt_charges: float = 0,
    service_tax: float = 0,
    discount: float = 0,
    total_amount: float = 0,
    advance_paid: float = 0,
    special_requests: Optional[str] = None,
    notes: Optional[str] = None,
    promo_code: Optional[str] = None,
) -> Booking:
    """Create a new booking"""
    from datetime import datetime

    # Convert string trip_type to TripType enum (handle both "one_way" and "ONE_WAY" formats)
    trip_type_upper = trip_type.upper().replace('-', '_')
    trip_type_enum = TripType(trip_type_upper)

    # Generate booking number
    booking_number = f"BK{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{str(uuid4())[:6].upper()}"

    balance_amount = total_amount - advance_paid

    booking = Booking(
        id=str(uuid4()),
        bookingNumber=booking_number,
        customerId=customer_id,
        vehicleId=vehicle_id,
        tripType=trip_type_enum,
        startDate=start_date,
        endDate=end_date,
        pickupLocation=pickup_location,
        pickupLandmark=pickup_landmark,
        pickupLat=pickup_lat,
        pickupLng=pickup_lng,
        pickupTime=pickup_time,
        dropLocation=drop_location,
        dropLandmark=drop_landmark,
        dropLat=drop_lat,
        dropLng=drop_lng,
        returnPickupLocation=return_pickup_location,
        returnDropLocation=return_drop_location,
        returnPickupTime=return_pickup_time,
        multiCityStops=multi_city_stops,
        estimatedDistanceKm=estimated_distance_km,
        estimatedDurationHours=estimated_duration_hours,
        passengerCount=passenger_count,
        baseFare=base_fare,
        distanceCharge=distance_charge,
        driverAllowance=driver_allowance,
        tollCharges=toll_charges,
        parkingCharges=parking_charges,
        nightHaltCharges=night_halt_charges,
        serviceTax=service_tax,
        discount=discount,
        totalAmount=total_amount,
        advancePaid=advance_paid,
        balanceAmount=balance_amount,
        paymentDueAmount=balance_amount,
        status=BookingStatus.PENDING,
        specialRequests=special_requests,
        notes=notes,
    )
    db.add(booking)
    await db.commit()
    await db.refresh(booking)
    return booking


async def update_booking_status(
    db: AsyncSession,
    booking_id: str,
    status: BookingStatus
) -> Optional[Booking]:
    """Update booking status"""
    booking = await get_booking_by_id(db, booking_id)
    if booking:
        booking.status = status
        if status == BookingStatus.CONFIRMED:
            from datetime import datetime
            booking.confirmed_at = datetime.utcnow()
        elif status == BookingStatus.COMPLETED:
            from datetime import datetime
            booking.completed_at = datetime.utcnow()
        elif status == BookingStatus.CANCELLED:
            from datetime import datetime
            booking.cancelled_at = datetime.utcnow()
        await db.commit()
        await db.refresh(booking)
    return booking


async def cancel_booking(
    db: AsyncSession,
    booking_id: str,
    reason: Optional[str] = None,
    cancelled_by: Optional[str] = None
) -> Optional[Booking]:
    """Cancel a booking"""
    booking = await get_booking_by_id(db, booking_id)
    if booking and booking.status in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = reason
        booking.cancelled_by = cancelled_by
        from datetime import datetime
        booking.cancelled_at = datetime.utcnow()
        await db.commit()
        await db.refresh(booking)
    return booking


async def get_customer_bookings(db: AsyncSession, customer_id: str) -> List[Booking]:
    """Get all bookings for a customer"""
    result = await db.execute(
        select(Booking)
        .where(Booking.customerId == customer_id)
        .order_by(Booking.createdAt.desc())
    )
    return list(result.scalars().all())


# ============================================================================
# VEHICLE AVAILABILITY CRUD
# ============================================================================

async def check_vehicle_availability(
    db: AsyncSession,
    vehicle_id: str,
    start_date,
    end_date
) -> bool:
    """Check if vehicle is available for the given date range"""
    # Check if vehicle exists and is available
    vehicle = await get_vehicle_by_id(db, vehicle_id)
    if not vehicle or not vehicle.isAvailable:
        return False

    # Check for existing bookings in the date range
    from sqlalchemy import overlap
    result = await db.execute(
        select(Booking).where(
            and_(
                Booking.vehicleId == vehicle_id,
                Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS]),
                # Overlapping date check
                or_(
                    and_(Booking.startDate <= start_date, Booking.endDate >= start_date),
                    and_(Booking.startDate <= end_date, Booking.endDate >= end_date),
                    and_(Booking.startDate >= start_date, Booking.endDate <= end_date),
                )
            )
        )
    )
    conflicting_bookings = result.scalar_one_or_none()

    return conflicting_bookings is None


async def get_available_vehicles_for_dates(
    db: AsyncSession,
    start_date,
    end_date,
    vehicle_type: Optional[VehicleType] = None,
    min_capacity: Optional[int] = None
) -> List[Vehicle]:
    """Get vehicles available for specific dates"""
    # Get all potentially available vehicles
    vehicles = await get_available_vehicles(db, vehicle_type=vehicle_type, min_capacity=min_capacity)

    # Filter out vehicles with conflicting bookings
    available_vehicles = []
    for vehicle in vehicles:
        if await check_vehicle_availability(db, vehicle.id, start_date, end_date):
            available_vehicles.append(vehicle)

    return available_vehicles


# ============================================================================
# PAYMENT CRUD
# ============================================================================

async def create_payment(
    db: AsyncSession,
    booking_id: str,
    customer_id: str,
    amount: float,
    payment_method: str,
    transaction_ref: Optional[str] = None,
) -> Payment:
    """Create a new payment"""
    from datetime import datetime
    from app.db.models import PaymentStatus, PaymentMethod

    payment = Payment(
        id=str(uuid4()),
        transaction_id=f"TXN{datetime.utcnow().strftime('%Y%m%d%H%M%S')}{str(uuid4())[:8].upper()}",
        booking_id=booking_id,
        customer_id=customer_id,
        amount=amount,
        payment_method=PaymentMethod(payment_method),
        status=PaymentStatus.PENDING,
        transaction_ref=transaction_ref,
    )
    db.add(payment)
    await db.commit()
    await db.refresh(payment)
    return payment


async def update_payment_status(
    db: AsyncSession,
    payment_id: str,
    status
) -> Optional[Payment]:
    """Update payment status"""
    from app.db.models import PaymentStatus
    from datetime import datetime

    payment = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = payment.scalar_one_or_none()

    if payment:
        payment.status = PaymentStatus(status)
        if status == PaymentStatus.COMPLETED:
            payment.completed_at = datetime.utcnow()
        await db.commit()
        await db.refresh(payment)
    return payment
