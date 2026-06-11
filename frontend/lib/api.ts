import axios from 'axios'

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
  return config
})

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bus_booking_auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API functions
export const busApi = {
  searchBuses: (params: {
    origin: string
    destination: string
    date: string
    passengers?: number
  }) =>
    api.get('/buses/search', { params }),

  getBus: (id: string) => api.get(`/buses/${id}`),

  getRoutes: () => api.get('/routes'),

  getAvailableSeats: (busId: string, date: string) =>
    api.get(`/buses/${busId}/seats`, { params: { date } }),
}

export const bookingApi = {
  createBooking: (data: {
    busId: string
    seats: number[]
    date: string
    passengerDetails: Array<{
      name: string
      email: string
      phone: string
    }>
  }) => api.post('/bookings', data),

  getBooking: (id: string) => api.get(`/bookings/${id}`),

  getUserBookings: () => api.get('/bookings/my-bookings'),

  cancelBooking: (id: string) => api.delete(`/bookings/${id}`),
}

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
