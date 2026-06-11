// Booking Flow Types

export type TripType = 'one-way' | 'round-trip' | 'multi-city'

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank-transfer'

export interface Location {
  id: string
  name: string
  city: string
  state: string
  pincode: string
  latitude?: number
  longitude?: number
}

export interface MultiCityStop {
  id: string
  location: Location
  duration?: number // minutes
}

export interface TripDetails {
  tripType: TripType
  pickupLocation: Location
  dropLocation: Location
  pickupDate: string
  pickupTime: string
  returnDate?: string
  returnTime?: string
  multiCityStops?: MultiCityStop[]
  passengerCount: number
  estimatedDistance?: number
  estimatedDuration?: number
}

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone?: string
  address: string
  city: string
  state: string
  pincode: string
  specialRequests?: string
  acceptTerms: boolean
}

export interface PriceBreakdown {
  baseFare: number
  driverCharges: number
  tollCharges: number
  tax: number
  discount: number
  total: number
}

export interface DiscountCode {
  code: string
  amount: number
  type: 'percentage' | 'fixed'
  description: string
}

export interface PaymentInfo {
  method: PaymentMethod
  cardDetails?: {
    number: string
    expiry: string
    cvv: string
    name: string
  }
  upiId?: string
}

export interface BookingFormData {
  vehicleId: string
  trip: TripDetails
  customer: CustomerInfo
  payment: PaymentInfo
  discountCode?: string
}

export interface BookingResponse {
  bookingId: string
  bookingNumber: string
  status: 'pending' | 'confirmed' | 'failed'
  amount: number
  createdAt: string
}

export interface FormStep {
  id: number
  title: string
  description: string
  completed: boolean
  current: boolean
}
