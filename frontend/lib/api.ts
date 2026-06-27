import axios from 'axios'
import type { VehicleType, VehicleAmenity, Vehicle } from '@/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('bus_booking_auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  console.log('API Request:', config.method?.toUpperCase(), config.url)
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.message)
    console.error('Error details:', error.response?.data)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bus_booking_auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ========== Vehicle API Functions ==========
export const vehicleApi = {
  // Get all vehicles with optional filters
  getVehicles: (params?: {
    type?: string
    min_capacity?: number
    max_capacity?: number
    min_price?: number
    max_price?: number
    amenities?: string
    location?: string
    available_only?: boolean
    page?: number
    page_size?: number
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }) => api.get('/vehicles', { params }),

  // Get vehicle by ID
  getVehicle: (id: string) => api.get(`/vehicles/${id}`),

  // Get vehicle categories
  getCategories: () => api.get('/vehicles/categories'),

  // Get vehicle types
  getTypes: () => api.get('/vehicles/types'),

  // Check available vehicles for date range
  getAvailableVehicles: (params: {
    start_date: string
    end_date: string
    vehicle_type?: string
    min_capacity?: number
  }) => api.get('/vehicles/available', { params }),

  // Check specific vehicle availability
  checkAvailability: (vehicleId: string, data: {
    start_date: string
    end_date: string
  }) => api.post(`/vehicles/${vehicleId}/check-availability`, data),
}

// ========== Booking API Functions ==========
export const bookingApi = {
  // Create new booking
  createBooking: (data: {
    vehicle_id: string
    trip_type?: string
    start_date: string
    end_date?: string
    pickup_location: {
      address: string
      landmark?: string
      city?: string
      latitude?: number
      longitude?: number
    }
    pickup_time: string
    drop_location: {
      address: string
      landmark?: string
      city?: string
      latitude?: number
      longitude?: number
    }
    return_pickup_location?: any
    return_drop_location?: any
    return_pickup_time?: string
    multi_city_stops?: any[]
    passenger_count?: number
    estimated_distance_km?: number
    estimated_duration_hours?: number
    special_requests?: string
    notes?: string
    promo_code?: string
    // Phone-based guest booking - phone is required
    contact_name?: string
    contact_phone: string  // Phone number is required for guest bookings
    contact_email?: string  // Email is optional
    captcha_token?: string  // For captcha verification
  }) => api.post('/bookings', data),

  // Get all bookings with filters
  getBookings: (params?: {
    customer_id?: string
    status?: string
    vehicle_id?: string
    date_from?: string
    date_to?: string
    page?: number
    page_size?: number
  }) => api.get('/bookings', { params }),

  // Get booking by ID
  getBooking: (id: string) => api.get(`/bookings/${id}`),

  // Get booking by number
  getBookingByNumber: (number: string) => api.get(`/bookings/number/${number}`),

  // Update booking
  updateBooking: (id: string, data: any) => api.put(`/bookings/${id}`, data),

  // Cancel booking
  cancelBooking: (id: string, reason?: string) =>
    api.put(`/bookings/${id}/cancel`, { reason }),

  // Confirm booking
  confirmBooking: (id: string) => api.put(`/bookings/${id}/confirm`),

  // Complete booking
  completeBooking: (id: string) => api.put(`/bookings/${id}/complete`),

  // Get price estimate
  getPriceEstimate: (data: {
    vehicle_id: string
    trip_type: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY'
    pickup_location: any
    drop_location: any
    return_pickup_location?: any
    return_drop_location?: any
    multi_city_stops?: any[]
    start_date: string
    end_date: string
    estimated_distance_km: number
    estimated_duration_hours: number
    passenger_count: number
    include_toll_charges?: boolean
    include_parking_charges?: boolean
    promo_code?: string
  }) => api.post('/bookings/estimate', data),
}

// ========== Availability API Functions ==========
export const availabilityApi = {
  // Get available vehicles by date
  getAvailableByDate: (params: {
    start_date: string
    end_date: string
    vehicle_type?: string
    min_capacity?: number
    location?: string
    group_by_date?: boolean
  }) => api.get('/availability/vehicles', { params }),

  // Check specific vehicle availability
  checkVehicleAvailability: (vehicleId: string, params: {
    start_date: string
    end_date: string
    include_bookings?: boolean
  }) => api.get(`/availability/vehicle/${vehicleId}`, { params }),

  // Block vehicle availability (admin)
  blockVehicle: (vehicleId: string, data: {
    start_date: string
    end_date: string
    reason: string
    is_maintenance?: boolean
  }) => api.post(`/availability/vehicle/${vehicleId}/block`, data),

  // Remove vehicle block (admin)
  removeBlock: (vehicleId: string, params: {
    start_date: string
    end_date: string
  }) => api.delete(`/availability/vehicle/${vehicleId}/block`, { params }),

  // Get availability summary
  getSummary: (params: {
    start_date: string
    end_date: string
    group_by_type?: boolean
  }) => api.get('/availability/summary', { params }),
}

// ========== Auth API Functions ==========
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  register: (data: {
    name: string
    email: string
    password: string
    phone: string
  }) => api.post('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  getProfile: () => api.get('/auth/profile'),
}

// ========== Routes API Functions ==========
export const routesApi = {
  getFeaturedRoutes: () => api.get('/routes/featured'),
  getDestinations: () => api.get('/routes/destinations'),
}

// ========== Admin API Functions ==========
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),

  getBuses: (params?: { page?: number; limit?: number }) =>
    api.get('/admin/buses', { params }),

  createBus: (data: any) => api.post('/admin/buses', data),

  updateBus: (id: string, data: any) => api.put(`/admin/buses/${id}`, data),

  deleteBus: (id: string) => api.delete(`/admin/buses/${id}`),

  getBookings: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get('/admin/bookings', { params }),

  updateBookingStatus: (id: string, status: string) =>
    api.patch(`/admin/bookings/${id}/status`, { status }),
}

// Export a convenience function for getting vehicle by ID
// Transforms API response to match frontend Vehicle type
export const getVehicleById = async (id: string): Promise<Vehicle> => {
  console.log('getVehicleById called with id:', id)
  console.log('API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1')
  try {
    const response = await vehicleApi.getVehicle(id)
    console.log('API response:', response.data)
    const v = response.data

    // Parse features if it's a string
    let features = []
    if (v.features) {
      if (typeof v.features === 'string') {
        try {
          const parsed = JSON.parse(v.features)
          features = parsed.features || []
        } catch {
          features = []
        }
      } else if (typeof v.features === 'object' && v.features.features) {
        features = v.features.features
      } else if (Array.isArray(v.features)) {
        features = v.features
      }
    }

    // Transform vehicle type from API format to frontend format
    const transformVehicleType = (apiType: string): VehicleType => {
      if (apiType.includes('CAR') || apiType.includes('SEATER')) return 'car'
      if (apiType.includes('TRAVELLER') || apiType.includes('TEMP')) return 'traveller'
      if (apiType.includes('COACH')) return 'coach'
      if (apiType.includes('BUS')) return 'bus'
      return 'car' // default
    }

    // Transform amenities from API format (AC, WIFI) to frontend format (ac, wifi)
    const transformAmenities = (apiAmenities: string[]): VehicleAmenity[] => {
      const amenityMap: Record<string, VehicleAmenity> = {
        'AC': 'ac',
        'WIFI': 'wifi',
        'USB_CHARGING': 'charging-point',
        'TV': 'tv',
        'TOILET': 'toilet',
        'WATER_BOTTLE': 'water-bottle',
        'WATER_BOTTLES': 'water-bottle',
        'BLANKET': 'blanket',
        'BLANKETS': 'blanket',
        'PILLOWS': 'blanket',
        'MEAL': 'meal',
        'SNACKS': 'meal',
        'MUSIC_SYSTEM': 'music-system',
        'FIRST_AID_KIT': 'first-aid-kit',
        'FIRE_EXTINGUISHER': 'fire-extinguisher',
        'GPS': 'gps',
        'REAR_CAMERA': 'rear-camera',
        'PUSHBACK_SEAT': 'pushback-seat',
        'PUSHBACK_SEATS': 'pushback-seat',
        'RECLINING_SEAT': 'reclining-seat',
        'RECLINING_SEATS': 'reclining-seats',
        'READING_LIGHTS': 'reading-light',
        'READING_LIGHT': 'reading-light',
        'LUGGAGE_SPACE': 'luggage-space',
        'PASSENGER_DISPLAY': 'passenger-display',
        'ENTERTAINMENT_SYSTEM': 'entertainment-system',
        'MICROPHONE': 'microphone',
        'REFRIGERATOR': 'refrigerator',
      }
      return apiAmenities.map(a => amenityMap[a] || a.toLowerCase().replace(/_/g, '-').replace(/ /g, '-') as VehicleAmenity)
    }

    return {
      id: v.id,
      name: v.name,
      type: transformVehicleType(v.type),
      make: v.make || '',
      model: v.model || '',
      year: v.year || new Date().getFullYear(),
      seatingCapacity: v.seatingCapacity || 5,
      amenities: transformAmenities(v.amenities || []),
      imageUrl: v.thumbnailImage || v.images?.[0] || '/images/placeholder-vehicle.jpg',
      images: v.images || [],
      rating: v.rating || 4.5,
      reviewCount: v.reviewCount || 0,
      basePrice: v.pricePerKm || 15,
      priceUnit: 'per-km',
      minCharge: v.minimumCharge || 250,
      driverCharges: v.driverAllowancePerDay || 500,
      features: features,
      description: v.description || '',
      specifications: v.specifications || {},
      available: v.isAvailable !== false,
      fuelType: v.fuelType || 'DIESEL',
    }
  } catch (error) {
    console.error('Error in getVehicleById:', error)
    throw error
  }
}
