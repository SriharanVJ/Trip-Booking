// Vehicle Types
export interface Bus {
  id: string
  busNumber: string
  operator: string
  type: BusType
  totalSeats: number
  amenities: Amenity[]
  rating?: number
}

export type BusType = 'sleeper' | 'seater' | 'semi-sleeper' | 'ac-sleeper' | 'ac-seater'

export type Amenity =
  | 'wifi'
  | 'ac'
  | 'charging-point'
  | 'water-bottle'
  | 'blanket'
  | 'meal'
  | 'tv'
  | 'toilet'

// Vehicle Catalog Types
export interface Vehicle {
  id: string
  name: string
  type: VehicleType
  make: string
  model: string
  year: number
  seatingCapacity: number
  amenities: VehicleAmenity[]
  imageUrl: string
  images: string[]
  rating: number
  reviewCount: number
  basePrice: number
  priceUnit: 'per-km' | 'per-day' | 'flat'
  minCharge: number
  driverCharges: number
  features: string[]
  description: string
  specifications: VehicleSpecifications
  available: boolean
}

export type VehicleType = 'car' | 'traveller' | 'coach' | 'bus'

export type VehicleAmenity =
  | 'ac'
  | 'wifi'
  | 'charging-point'
  | 'tv'
  | 'toilet'
  | 'water-bottle'
  | 'blanket'
  | 'meal'
  | 'music-system'
  | 'first-aid-kit'
  | 'fire-extinguisher'
  | 'gps'
  | 'rear-camera'
  | 'pushback-seat'

export interface VehicleSpecifications {
  engine: string
  fuelType: 'petrol' | 'diesel' | 'cng' | 'electric'
  transmission: 'manual' | 'automatic'
  mileage: string
  length?: string
  width?: string
  height?: string
  luggageCapacity: string
}

export interface VehicleFilterParams {
  seatingCapacity?: number[]
  vehicleTypes?: VehicleType[]
  dateFrom?: string
  dateTo?: string
  priceMin?: number
  priceMax?: number
  amenities?: VehicleAmenity[]
  location?: string
  page?: number
  limit?: number
}

export interface VehicleReview {
  id: string
  vehicleId: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  comment: string
  createdAt: string
  helpful: number
}

export interface VehicleAvailability {
  date: string
  available: boolean
  price?: number
  reason?: string
}

export interface VehicleSearchResult {
  vehicles: Vehicle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface Route {
  id: string
  origin: string
  destination: string
  distance: number
  duration: number
  popular: boolean
}

export interface Schedule {
  id: string
  busId: string
  routeId: string
  departureTime: string
  arrivalTime: string
  price: number
  availableSeats: number
}

export interface BusSearchResult {
  schedule: Schedule
  bus: Bus
  route: Route
}

// Booking Types
export interface Seat {
  number: number
  type: 'window' | 'aisle'
  available: boolean
  price?: number
}

export interface Booking {
  id: string
  scheduleId: string
  seats: number[]
  status: BookingStatus
  totalAmount: number
  passengerDetails: PassengerDetails[]
  createdAt: string
  updatedAt: string
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface PassengerDetails {
  name: string
  email: string
  phone: string
  age?: number
  gender?: 'male' | 'female' | 'other'
}

// Auth Types
export interface User {
  id: string
  name: string
  email: string
  phone: string
  role: 'user' | 'admin'
  createdAt: string
}

export interface AuthResponse {
  user: User
  token: string
}

// Admin Types
export interface DashboardStats {
  totalBookings: number
  totalRevenue: number
  activeBuses: number
  todayBookings: number
  recentBookings: Booking[]
}

// Form Types
export interface SearchParams {
  origin: string
  destination: string
  date: string
  passengers?: number
}

export interface BookingFormData {
  scheduleId: string
  seats: number[]
  date: string
  passengers: PassengerDetails[]
}
