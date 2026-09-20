'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useCallback, useEffect } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { TripDetails } from './TripDetails'
import { CustomerDetails } from './CustomerDetails'
import { ReviewAndPay } from './ReviewAndPay'
import { BookingConfirmation } from './BookingConfirmation'
import type { Vehicle } from '@/types'
import type { TripDetails as TripDetailsType, CustomerInfo, BookingResponse } from '@/types/booking'

export type BookingStep = 'trip' | 'customer' | 'review' | 'confirmation'

interface BookingFormProps {
  vehicle: Vehicle
  onComplete?: (bookingNumber: string) => void
}

interface FormData {
  trip: TripDetailsType | null
  customer: CustomerInfo | null
  payment: any | null
}

export function BookingForm({ vehicle, onComplete }: BookingFormProps) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState<BookingStep>('trip')
  const [formData, setFormData] = useState<FormData>({
    trip: null,
    customer: null,
    payment: null
  })
  const [bookingResponse, setBookingResponse] = useState<BookingResponse | null>(null)

  // Get search params for pre-population
  const searchParamsData = {
    origin: searchParams.get('origin') || undefined,
    destination: searchParams.get('destination') || undefined,
    date: searchParams.get('date') || undefined,
    passengers: searchParams.get('passengers') || undefined
  }

  // Load saved form data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`booking-${vehicle.id}`)
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData)
        // Only restore trip and customer data, not payment (payment should always be fresh)
        const { payment, ...restoredData } = parsed
        setFormData(restoredData)
        // Don't auto-advance - always start from trip step
        setCurrentStep('trip')
      } catch (err) {
        console.error('Error loading saved form data:', err)
      }
    }
  }, [vehicle.id])

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    if (formData.trip || formData.customer) {
      localStorage.setItem(`booking-${vehicle.id}`, JSON.stringify(formData))
    }
  }, [formData, vehicle.id])

  const steps = [
    { id: 'trip' as const, title: 'Trip Details', description: 'Route & Schedule' },
    { id: 'customer' as const, title: 'Customer Details', description: 'Contact Information' },
    { id: 'review' as const, title: 'Review & Pay', description: 'Payment' },
    { id: 'confirmation' as const, title: 'Confirmation', description: 'Complete' }
  ]

  const getStepIndex = (step: BookingStep) => {
    return steps.findIndex(s => s.id === step)
  }

  const currentStepIndex = getStepIndex(currentStep)

  const isStepComplete = (stepId: BookingStep) => {
    switch (stepId) {
      case 'trip':
        return !!formData.trip
      case 'customer':
        return !!formData.customer
      case 'review':
        return !!formData.payment
      case 'confirmation':
        return !!bookingResponse
      default:
        return false
    }
  }

  const handleTripSubmit = useCallback((tripData: TripDetailsType) => {
    setFormData(prev => ({ ...prev, trip: tripData }))
    setCurrentStep('customer')
  }, [])

  const handleCustomerSubmit = useCallback((customerData: CustomerInfo) => {
    setFormData(prev => ({ ...prev, customer: customerData }))
    setCurrentStep('review')
  }, [])

  const handlePaymentSubmit = useCallback(async (paymentData: any) => {
    setFormData(prev => ({ ...prev, payment: paymentData }))

    try {
      // Import booking API
      const { bookingApi } = await import('@/lib/api')

      // Validate required trip data
      if (!formData.trip?.pickupDate || !formData.trip?.pickupTime) {
        console.error('Missing required fields:', {
          pickupDate: formData.trip?.pickupDate,
          pickupTime: formData.trip?.pickupTime,
          trip: formData.trip
        })
        throw new Error('Pickup date and time are required')
      }

      // Helper function to combine date (ISO string or Date) and time (HH:MM format)
      const combineDateTime = (dateInput: string | Date, timeStr: string): Date => {
        console.log('combineDateTime called with:', { dateInput, timeStr, dateType: typeof dateInput })

        // Handle both string and Date inputs
        let date: Date
        if (typeof dateInput === 'string') {
          date = new Date(dateInput)
        } else if (dateInput instanceof Date) {
          date = new Date(dateInput.getTime()) // Clone the Date
        } else {
          throw new Error('Invalid date input type')
        }

        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.error('Invalid date:', dateInput)
          throw new Error(`Invalid date format: ${dateInput}`)
        }

        // Parse time string (HH:MM format)
        const timeParts = timeStr.split(':').map(Number)
        const hours = timeParts[0] ?? 0
        const minutes = timeParts[1] ?? 0

        // Validate time components
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
          console.error('Invalid time format:', timeStr)
          throw new Error(`Invalid time format: ${timeStr} (expected HH:MM)`)
        }

        // Set hours and minutes while preserving the date
        date.setHours(hours, minutes, 0, 0)
        console.log('Final date:', date.toISOString(), 'isValid:', !isNaN(date.getTime()))

        return date
      }

      // Combine date and time for datetime fields
      let pickupDateTime: Date
      try {
        pickupDateTime = combineDateTime(formData.trip.pickupDate, formData.trip.pickupTime)
      } catch (err) {
        console.error('Failed to parse pickup date/time:', err)
        throw new Error(`Invalid pickup date or time: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }

      if (isNaN(pickupDateTime.getTime())) {
        console.error('Invalid pickup date/time:', {
          pickupDate: formData.trip.pickupDate,
          pickupTime: formData.trip.pickupTime,
          result: pickupDateTime
        })
        throw new Error('Invalid pickup date or time format')
      }

      // Calculate end date (default to same day + 8 hours if not specified)
      let endDateTime = pickupDateTime
      if (formData.trip?.returnDate && formData.trip?.returnTime) {
        try {
          endDateTime = combineDateTime(formData.trip.returnDate, formData.trip.returnTime)
        } catch (err) {
          console.error('Failed to parse return date/time:', err)
          throw new Error(`Invalid return date or time: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
        if (isNaN(endDateTime.getTime())) {
          throw new Error('Invalid return date or time format')
        }
      } else {
        // Default to 8 hours after pickup
        endDateTime = new Date(pickupDateTime.getTime() + 8 * 60 * 60 * 1000)
      }

      // Prepare booking data for API - matching backend schema
      const bookingData = {
        vehicle_id: vehicle.id,
        trip_type: (formData.trip?.tripType || 'one-way').toLowerCase().replace('-', '_'),
        start_date: pickupDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        pickup_location: {
          address: formData.trip?.pickupLocation?.name || '',
          city: formData.trip?.pickupLocation?.city || '',
        },
        pickup_time: pickupDateTime.toISOString(),
        drop_location: {
          address: formData.trip?.dropLocation?.name || '',
          city: formData.trip?.dropLocation?.city || '',
        },
        return_pickup_location: (formData.trip?.tripType === 'round-trip' && formData.trip?.returnDate) ? {
          address: formData.trip?.dropLocation?.name || '',
          city: formData.trip?.dropLocation?.city || '',
        } : undefined,
        return_drop_location: (formData.trip?.tripType === 'round-trip' && formData.trip?.returnDate) ? {
          address: formData.trip?.pickupLocation?.name || '',
          city: formData.trip?.pickupLocation?.city || '',
        } : undefined,
        return_pickup_time: (formData.trip?.returnDate && formData.trip?.returnTime)
          ? endDateTime.toISOString()
          : undefined,
        passenger_count: formData.trip?.passengerCount || 1,
        estimated_distance_km: formData.trip?.estimatedDistance || 0,
        estimated_duration_hours: formData.trip?.estimatedDuration ? formData.trip.estimatedDuration / 60 : 0,
        // Phone-based guest booking
        contact_name: `${formData.customer?.firstName} ${formData.customer?.lastName}`.trim(),
        contact_phone: formData.customer?.phone || '',  // Phone is required
        contact_email: formData.customer?.email || undefined,  // Email is optional
        promo_code: paymentData.discount?.code,
      }

      console.log('Creating booking with data:', bookingData)

      // Call the real booking API
      const response = await bookingApi.createBooking(bookingData)
      console.log('Booking API response:', response.data)

      // Create booking response from API response
      const bookingResponse: BookingResponse = {
        bookingId: response.data.id,
        bookingNumber: response.data.bookingNumber,
        status: response.data.status?.toLowerCase() || 'confirmed',
        amount: paymentData.amount,
        createdAt: response.data.createdAt || new Date().toISOString()
      }

      setBookingResponse(bookingResponse)
      setCurrentStep('confirmation')
      onComplete?.(bookingResponse.bookingNumber)

      // Clear saved form data after successful booking
      localStorage.removeItem(`booking-${vehicle.id}`)
    } catch (error: any) {
      console.error('Booking failed:', error)
      console.error('Error response:', error.response?.data)

      // Show error to user
      alert(`Booking failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`)

      // Fall back to mock for development if API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Falling back to mock booking in development mode')
        const mockBookingResponse: BookingResponse = {
          bookingId: `booking-${Date.now()}`,
          bookingNumber: `BB${Date.now().toString().slice(-8).toUpperCase()}`,
          status: 'confirmed',
          amount: paymentData.amount,
          createdAt: new Date().toISOString()
        }
        setBookingResponse(mockBookingResponse)
        setCurrentStep('confirmation')
        onComplete?.(mockBookingResponse.bookingNumber)
        localStorage.removeItem(`booking-${vehicle.id}`)
      }
    }
  }, [vehicle.id, onComplete, formData, vehicle])

  const handleBack = useCallback(() => {
    const stepOrder: BookingStep[] = ['trip', 'customer', 'review', 'confirmation']
    const currentIndex = stepOrder.indexOf(currentStep)
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1])
    }
  }, [currentStep])

  const handleGoToStep = useCallback((stepId: BookingStep) => {
    // Only allow going back to already completed steps
    const stepIndex = getStepIndex(stepId)
    const isAccessible = stepIndex < currentStepIndex || isStepComplete(stepId)

    if (isAccessible) {
      setCurrentStep(stepId)
    }
  }, [currentStepIndex])

  const renderStep = () => {
    switch (currentStep) {
      case 'trip':
        return (
          <TripDetails
            vehicle={vehicle}
            onNext={handleTripSubmit}
            initialData={formData.trip}
            searchParams={searchParamsData}
          />
        )

      case 'customer':
        return (
          <CustomerDetails
            onNext={handleCustomerSubmit}
            onBack={handleBack}
            passengerCount={formData.trip?.passengerCount || 1}
            initialData={formData.customer || undefined}
          />
        )

      case 'review':
        return (
          <ReviewAndPay
            vehicle={vehicle}
            trip={formData.trip!}
            customer={formData.customer!}
            onBack={handleBack}
            onSubmit={handlePaymentSubmit}
          />
        )

      case 'confirmation':
        return bookingResponse ? (
          <BookingConfirmation
            booking={bookingResponse}
            vehicle={vehicle}
            trip={formData.trip!}
            customer={formData.customer!}
            amount={formData.payment?.amount || 0}
          />
        ) : null

      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex-1">
                <button
                  onClick={() => handleGoToStep(step.id)}
                  disabled={index > currentStepIndex && !isStepComplete(step.id)}
                  className={cn(
                    'w-full group relative',
                    index < steps.length - 1 && 'after:content-[""] after:absolute after:top-4 after:left-1/2 after:w-full after:h-0.5 after:bg-border after:transition-colors',
                    index < currentStepIndex && 'after:bg-primary'
                  )}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors',
                        isStepComplete(step.id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : currentStep === step.id
                          ? 'border-primary text-primary'
                          : 'border-border bg-muted text-muted-foreground'
                      )}
                    >
                      {isStepComplete(step.id) ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          'text-xs font-medium',
                          currentStep === step.id ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <div className="min-h-[500px]">
        {renderStep()}
      </div>

      {/* Step Navigation Info */}
      {currentStep !== 'confirmation' && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">Form Auto-Save Enabled</p>
              <p className="text-xs text-muted-foreground">
                Your progress is saved automatically. You can close this page and return later to complete your booking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
