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
        setFormData(parsed)
        if (parsed.payment) {
          setCurrentStep('confirmation')
        } else if (parsed.customer) {
          setCurrentStep('review')
        }
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

    // Simulate API call to create booking
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

    // Clear saved form data after successful booking
    localStorage.removeItem(`booking-${vehicle.id}`)
  }, [vehicle.id, onComplete])

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
