import { PrismaClient, VehicleType, Amenities } from '@prisma/client'

const prisma = new PrismaClient()

// Vehicle data with pricing strategy
const vehicles = [
  // 5 Seater Cars
  {
    registrationNumber: 'TN-01-AB-1234',
    name: 'Toyota Innova Crysta 5-Seater',
    type: VehicleType.CAR_5_SEATER,
    seatingCapacity: 5,
    pricePerKm: 12,
    minimumCharge: 250,
    driverAllowancePerDay: 300,
    minimumDays: 1,
    make: 'Toyota',
    model: 'Innova Crysta',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.GPS, Amenities.FIRST_AID_KIT],
    images: [
      'https://example.com/images/innova-5s-1.jpg',
      'https://example.com/images/innova-5s-2.jpg',
      'https://example.com/images/innova-5s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/innova-5s-thumb.jpg',
    description: 'Premium 5-seater SUV with comfortable seating for small groups. Perfect for city tours and outstation trips.',
    features: '{"features": ["Pushback seats", "Individual AC vents", "Ample luggage space", "Premium audio system"]}'
  },
  {
    registrationNumber: 'TN-01-AB-1235',
    name: 'Maruti Suzuki Ertiga 5-Seater',
    type: VehicleType.CAR_5_SEATER,
    seatingCapacity: 5,
    pricePerKm: 12,
    minimumCharge: 250,
    driverAllowancePerDay: 300,
    minimumDays: 1,
    make: 'Maruti Suzuki',
    model: 'Ertiga',
    year: 2024,
    fuelType: 'CNG',
    color: 'Silver',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.GPS, Amenities.FIRST_AID_KIT],
    images: [
      'https://example.com/images/ertiga-5s-1.jpg',
      'https://example.com/images/ertiga-5s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/ertiga-5s-thumb.jpg',
    description: 'Economical 5-seater MPV with CNG option for fuel-efficient journeys.',
    features: '{"features": ["Foldable seats", "Good mileage", "Spacious cabin"]}'
  },

  // 7 Seater Cars
  {
    registrationNumber: 'TN-01-AB-2234',
    name: 'Toyota Innova Crysta 7-Seater',
    type: VehicleType.CAR_7_SEATER,
    seatingCapacity: 7,
    pricePerKm: 15,
    minimumCharge: 300,
    driverAllowancePerDay: 350,
    minimumDays: 1,
    make: 'Toyota',
    model: 'Innova Crysta',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'Pearl White',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.PUSHBACK_SEATS],
    images: [
      'https://example.com/images/innova-7s-1.jpg',
      'https://example.com/images/innova-7s-2.jpg',
      'https://example.com/images/innova-7s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/innova-7s-thumb.jpg',
    description: 'Spacious 7-seater SUV ideal for family trips and corporate travel.',
    features: '{"features": ["Captain seats in middle row", "Premium sound system", "Climate control", "Rear AC vents"]}'
  },
  {
    registrationNumber: 'TN-01-AB-2235',
    name: 'Mahindra Scorpio-N 7-Seater',
    type: VehicleType.CAR_7_SEATER,
    seatingCapacity: 7,
    pricePerKm: 15,
    minimumCharge: 300,
    driverAllowancePerDay: 350,
    minimumDays: 1,
    make: 'Mahindra',
    model: 'Scorpio-N',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'Black',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.PUSHBACK_SEATS],
    images: [
      'https://example.com/images/scorpio-7s-1.jpg',
      'https://example.com/images/scorpio-7s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/scorpio-7s-thumb.jpg',
    description: 'Rugged 7-seater SUV perfect for adventure trips and rough terrains.',
    features: '{"features": ["4x4 option", "High ground clearance", "Powerful engine", "Premium interiors"]}'
  },

  // 9 Seater Cars
  {
    registrationNumber: 'TN-01-AB-3234',
    name: 'Force Traveller 9-Seater',
    type: VehicleType.CAR_9_SEATER,
    seatingCapacity: 9,
    pricePerKm: 18,
    minimumCharge: 350,
    driverAllowancePerDay: 400,
    minimumDays: 1,
    make: 'Force Motors',
    model: 'Traveller 3350',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.LUGGAGE_SPACE],
    images: [
      'https://example.com/images/traveller-9s-1.jpg',
      'https://example.com/images/traveller-9s-2.jpg',
      'https://example.com/images/traveller-9s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/traveller-9s-thumb.jpg',
    description: 'Comfortable 9-seater van for medium groups and family outings.',
    features: '{"features": ["Spacious interiors", "Individual reading lights", "Ample legroom", "Large boot space"]}'
  },
  {
    registrationNumber: 'TN-01-AB-3235',
    name: 'Maruti Suzuki Eeco 9-Seater',
    type: VehicleType.CAR_9_SEATER,
    seatingCapacity: 9,
    pricePerKm: 18,
    minimumCharge: 350,
    driverAllowancePerDay: 400,
    minimumDays: 1,
    make: 'Maruti Suzuki',
    model: 'Eeco',
    year: 2024,
    fuelType: 'CNG',
    color: 'Metallic Blue',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.LUGGAGE_SPACE],
    images: [
      'https://example.com/images/eeco-9s-1.jpg',
      'https://example.com/images/eeco-9s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/eeco-9s-thumb.jpg',
    description: 'Budget-friendly 9-seater van with CNG option for economical group travel.',
    features: '{"features": ["Best in class mileage", "Easy maintenance", "Low operating cost"]}'
  },

  // 14 Seater Traveller
  {
    registrationNumber: 'TN-01-AB-4234',
    name: 'Force Traveller 14-Seater',
    type: VehicleType.TRAVELLER_14_SEATER,
    seatingCapacity: 14,
    pricePerKm: 22,
    minimumCharge: 400,
    driverAllowancePerDay: 500,
    minimumDays: 1,
    make: 'Force Motors',
    model: 'Traveller 3350',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.LUGGAGE_SPACE, Amenities.WATER_BOTTLES],
    images: [
      'https://example.com/images/traveller-14s-1.jpg',
      'https://example.com/images/traveller-14s-2.jpg',
      'https://example.com/images/traveller-14s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/traveller-14s-thumb.jpg',
    description: 'Popular 14-seater minibus perfect for corporate outings, airport transfers, and group tours.',
    features: '{"features": ["Pushback seats", "Dual AC", "Music system", "Excellent mileage", "Comfortable suspension"]}'
  },
  {
    registrationNumber: 'TN-01-AB-4235',
    name: 'Tata Winger 14-Seater',
    type: VehicleType.TRAVELLER_14_SEATER,
    seatingCapacity: 14,
    pricePerKm: 22,
    minimumCharge: 400,
    driverAllowancePerDay: 500,
    minimumDays: 1,
    make: 'Tata Motors',
    model: 'Winger',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.LUGGAGE_SPACE],
    images: [
      'https://example.com/images/winger-14s-1.jpg',
      'https://example.com/images/winger-14s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/winger-14s-thumb.jpg',
    description: 'Reliable 14-seater van with comfortable seating for group travel.',
    features: '{"features": ["Robust build", "Good suspension", "Spacious", "Value for money"]}'
  },

  // 21 Seater Coach
  {
    registrationNumber: 'TN-01-AB-5234',
    name: 'BharatBenz 21-Seater Coach',
    type: VehicleType.COACH_21_SEATER,
    seatingCapacity: 21,
    pricePerKm: 28,
    minimumCharge: 500,
    driverAllowancePerDay: 600,
    minimumDays: 1,
    make: 'BharatBenz',
    model: '917 Coach',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White with Blue Stripe',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.BLANKETS, Amenities.PILLOWS, Amenities.WATER_BOTTLES, Amenities.LUGGAGE_SPACE, Amenities.PASSENGER_DISPLAY],
    images: [
      'https://example.com/images/bharatbenz-21s-1.jpg',
      'https://example.com/images/bharatbenz-21s-2.jpg',
      'https://example.com/images/bharatbenz-21s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/bharatbenz-21s-thumb.jpg',
    description: 'Premium 21-seater coach for corporate groups, weddings, and special events.',
    features: '{"features": ["Premium interiors", "Individual charging points", "Climate control", "Reclining seats with armrest", "Large luggage compartment"]}'
  },
  {
    registrationNumber: 'TN-01-AB-5235',
    name: 'Tata LPO 21-Seater Coach',
    type: VehicleType.COACH_21_SEATER,
    seatingCapacity: 21,
    pricePerKm: 28,
    minimumCharge: 500,
    driverAllowancePerDay: 600,
    minimumDays: 1,
    make: 'Tata Motors',
    model: 'LPO 1618',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.LUGGAGE_SPACE],
    images: [
      'https://example.com/images/tata-21s-1.jpg',
      'https://example.com/images/tata-21s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/tata-21s-thumb.jpg',
    description: 'Reliable 21-seater coach suitable for corporate and group travel.',
    features: '{"features": ["Strong build quality", "Comfortable seating", "Good AC", "Value for money"]}'
  },

  // 24 Seater Coach
  {
    registrationNumber: 'TN-01-AB-6234',
    name: 'Eicher 24-Seater Coach',
    type: VehicleType.COACH_24_SEATER,
    seatingCapacity: 24,
    pricePerKm: 32,
    minimumCharge: 600,
    driverAllowancePerDay: 700,
    minimumDays: 1,
    make: 'Eicher',
    model: '2055T Coach',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White with Red Stripe',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.BLANKETS, Amenities.PILLOWS, Amenities.WATER_BOTTLES, Amenities.SNACKS, Amenities.LUGGAGE_SPACE, Amenities.PASSENGER_DISPLAY, Amenities.MICROPHONE],
    images: [
      'https://example.com/images/eicher-24s-1.jpg',
      'https://example.com/images/eicher-24s-2.jpg',
      'https://example.com/images/eicher-24s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/eicher-24s-thumb.jpg',
    description: 'Luxurious 24-seater coach perfect for large groups, weddings, and corporate events.',
    features: '{"features": ["Premium pushback seats", "Individual entertainment screens", "Climate control", "Hot and cold water dispenser", "Dedicated luggage space"]}'
  },
  {
    registrationNumber: 'TN-01-AB-6235',
    name: 'BharatBenz 24-Seater Coach',
    type: VehicleType.COACH_24_SEATER,
    seatingCapacity: 24,
    pricePerKm: 32,
    minimumCharge: 600,
    driverAllowancePerDay: 700,
    minimumDays: 1,
    make: 'BharatBenz',
    model: '1015 Coach',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White',
    amenities: [Amenities.AC, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.BLANKETS, Amenities.WATER_BOTTLES, Amenities.LUGGAGE_SPACE, Amenities.PASSENGER_DISPLAY],
    images: [
      'https://example.com/images/bharatbenz-24s-1.jpg',
      'https://example.com/images/bharatbenz-24s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/bharatbenz-24s-thumb.jpg',
    description: 'Comfortable 24-seater coach for group travel and events.',
    features: '{"features": ["Spacious seating", "Excellent AC", "Smooth ride", "Good suspension"]}'
  },

  // 52 Seater Bus
  {
    registrationNumber: 'TN-01-AB-7234',
    name: 'Volvo 9400 52-Seater Luxury Bus',
    type: VehicleType.BUS_52_SEATER,
    seatingCapacity: 52,
    pricePerKm: 45,
    minimumCharge: 1000,
    driverAllowancePerDay: 1000,
    minimumDays: 2,
    make: 'Volvo',
    model: '9400 B11R',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White with Graphics',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.BLANKETS, Amenities.PILLOWS, Amenities.WATER_BOTTLES, Amenities.SNACKS, Amenities.LUGGAGE_SPACE, Amenities.PASSENGER_DISPLAY, Amenities.MICROPHONE, Amenities.REFRIGERATOR],
    images: [
      'https://example.com/images/volvo-52s-1.jpg',
      'https://example.com/images/volvo-52s-2.jpg',
      'https://example.com/images/volvo-52s-3.jpg'
    ],
    thumbnailImage: 'https://example.com/images/volvo-52s-thumb.jpg',
    description: 'Premium luxury 52-seater Volvo bus for long-distance tours and corporate travel.',
    features: '{"features": ["Luxury reclining seats with leg rest", "Individual entertainment screens", "On-board restroom", "Hot and cold water dispenser", "Refrigerator", "Dedicated attendant", "Emergency exit"]}'
  },
  {
    registrationNumber: 'TN-01-AB-7235',
    name: 'Scania Metrolink 52-Seater Bus',
    type: VehicleType.BUS_52_SEATER,
    seatingCapacity: 52,
    pricePerKm: 45,
    minimumCharge: 1000,
    driverAllowancePerDay: 1000,
    minimumDays: 2,
    make: 'Scania',
    model: 'Metrolink HD',
    year: 2024,
    fuelType: 'DIESEL',
    color: 'White with Blue Graphics',
    amenities: [Amenities.AC, Amenities.WIFI, Amenities.USB_CHARGING, Amenities.ENTERTAINMENT_SYSTEM, Amenities.GPS, Amenities.FIRST_AID_KIT, Amenities.FIRE_EXTINGUISHER, Amenities.RECLINING_SEATS, Amenities.PUSHBACK_SEATS, Amenities.READING_LIGHTS, Amenities.BLANKETS, Amenities.PILLOWS, Amenities.WATER_BOTTLES, Amenities.SNACKS, Amenities.LUGGAGE_SPACE, Amenities.PASSENGER_DISPLAY, Amenities.MICROPHONE],
    images: [
      'https://example.com/images/scania-52s-1.jpg',
      'https://example.com/images/scania-52s-2.jpg'
    ],
    thumbnailImage: 'https://example.com/images/scania-52s-thumb.jpg',
    description: 'Luxury 52-seater Scania bus for premium travel experience.',
    features: '{"features": ["World-class comfort", "Advanced safety features", "Excellent suspension", "Premium interiors", "Large luggage space"]}'
  }
]

// Admin user
const adminUser = {
  email: 'admin@busbooking.com',
  passwordHash: '$2a$10$YourHashedPasswordHere', // Should be properly hashed
  username: 'admin',
  firstName: 'System',
  lastName: 'Administrator',
  phone: '+919876543210',
  role: 'SUPER_ADMIN',
  permissions: [
    'MANAGE_VEHICLES',
    'MANAGE_BOOKINGS',
    'MANAGE_CUSTOMERS',
    'MANAGE_PAYMENTS',
    'MANAGE_ADMINS',
    'MANAGE_PRICING',
    'MANAGE_PROMO_CODES',
    'VIEW_REPORTS',
    'MANAGE_SETTINGS'
  ],
  isActive: true,
  isSuperAdmin: true
}

// Sample customers
const customers = [
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh.kumar@example.com',
    phone: '+919876543201',
    alternatePhone: '+919876543202',
    addressLine1: '123, Anna Nagar',
    addressLine2: 'Near Park',
    city: 'Chennai',
    state: 'Tamil Nadu',
    postalCode: '600040',
    country: 'India',
    isVerified: true,
    isCorporate: false
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya.sharma@example.com',
    phone: '+919876543203',
    alternatePhone: null,
    addressLine1: '456, Gandhinagar',
    addressLine2: 'Main Road',
    city: 'Bangalore',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    isVerified: true,
    isCorporate: false
  },
  {
    firstName: 'Technology',
    lastName: 'Solutions Pvt Ltd',
    email: 'contact@techsolutions.com',
    phone: '+919876543204',
    alternatePhone: '+919876543205',
    addressLine1: '789, Tech Park',
    addressLine2: 'Phase 2',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'India',
    companyName: 'Technology Solutions Pvt Ltd',
    companyGst: '29AABCU9603R1ZM',
    companyAddress: '789, Tech Park, Phase 2, Hyderabad - 500081',
    isVerified: true,
    isCorporate: true
  }
]

// Sample promo codes
const promoCodes = [
  {
    code: 'WELCOME10',
    description: 'Welcome discount for first-time users',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maxDiscountAmount: 500,
    minBookingAmount: 2000,
    applicableVehicleTypes: [],
    applicableTripTypes: [],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    maxUses: 1000,
    maxUsesPerUser: 1,
    isActive: true
  },
  {
    code: 'FESTIVE500',
    description: 'Flat ₹500 discount on festive season bookings',
    discountType: 'FIXED_AMOUNT',
    discountValue: 500,
    minBookingAmount: 5000,
    applicableVehicleTypes: [],
    applicableTripTypes: ['ROUND_TRIP'],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    maxUses: null,
    maxUsesPerUser: 3,
    isActive: true
  },
  {
    code: 'GROUP15',
    description: '15% off on bookings for 21+ seater vehicles',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    maxDiscountAmount: 2000,
    minBookingAmount: 10000,
    applicableVehicleTypes: ['COACH_21_SEATER', 'COACH_24_SEATER', 'BUS_52_SEATER'],
    applicableTripTypes: [],
    startDate: new Date('2024-01-01'),
    endDate: new Date('2025-12-31'),
    maxUses: 500,
    maxUsesPerUser: 5,
    isActive: true
  }
]

async function main() {
  console.log('Starting database seed...')

  // Clear existing data
  console.log('Clearing existing data...')
  await prisma.promoCodeUsage.deleteMany()
  await prisma.promoCode.deleteMany()
  await prisma.vehicleAvailability.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.maintenanceLog.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.vehicle.deleteMany()
  await prisma.admin.deleteMany()

  console.log('Creating vehicles...')
  // Create vehicles
  for (const vehicle of vehicles) {
    await prisma.vehicle.create({
      data: {
        registrationNumber: vehicle.registrationNumber,
        name: vehicle.name,
        type: vehicle.type,
        seatingCapacity: vehicle.seatingCapacity,
        pricePerKm: vehicle.pricePerKm,
        minimumCharge: vehicle.minimumCharge,
        driverAllowancePerDay: vehicle.driverAllowancePerDay,
        minimumDays: vehicle.minimumDays,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        fuelType: vehicle.fuelType,
        color: vehicle.color,
        amenities: vehicle.amenities,
        images: vehicle.images,
        thumbnailImage: vehicle.thumbnailImage,
        description: vehicle.description,
        features: vehicle.features
      }
    })
    console.log(`Created vehicle: ${vehicle.name}`)
  }

  console.log('Creating admin user...')
  // Create admin user
  await prisma.admin.create({
    data: adminUser
  })
  console.log('Created admin user')

  console.log('Creating customers...')
  // Create customers
  for (const customer of customers) {
    await prisma.customer.create({
      data: customer
    })
    console.log(`Created customer: ${customer.firstName} ${customer.lastName}`)
  }

  console.log('Creating promo codes...')
  // Create promo codes
  for (const promo of promoCodes) {
    await prisma.promoCode.create({
      data: promo
    })
    console.log(`Created promo code: ${promo.code}`)
  }

  console.log('Database seed completed successfully!')
  console.log('\n=== Summary ===')
  console.log(`Vehicles created: ${vehicles.length}`)
  console.log(`Admin users created: 1`)
  console.log(`Customers created: ${customers.length}`)
  console.log(`Promo codes created: ${promoCodes.length}`)
}

main()
  .catch((e) => {
    console.error('Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
