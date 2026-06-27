'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookingForm } from '@/components/booking/BookingForm'
import { TripSummarySidebar } from '@/components/booking/TripSummarySidebar'
import { getVehicleById } from '@/lib/api'
import type { Vehicle } from '@/types'

interface BookingPageClientProps {
  vehicleId: string
}

export function BookingPageClient({ vehicleId }: BookingPageClientProps) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Loading vehicle with ID:', vehicleId)
        const vehicleData = await getVehicleById(vehicleId)
        console.log('Vehicle data loaded:', vehicleData)
        setVehicle(vehicleData)
      } catch (err: any) {
        console.error('Failed to load vehicle:', err)
        console.error('Error response:', err?.response)
        setError(err?.response?.data?.detail || err?.message || 'Failed to load vehicle. Please try again later.')
        // Redirect to vehicles page after a delay
        setTimeout(() => router.push('/vehicles'), 3000)
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      loadVehicle()
    } else {
      setError('Vehicle ID is missing')
      setLoading(false)
    }
  }, [vehicleId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
            <p className="text-warm-white-dark/60">Loading vehicle details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Vehicle not found'}</p>
            <p className="text-warm-white-dark/60">Redirecting to vehicles page...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Booking Form */}
        <div className="lg:col-span-2">
          <BookingForm vehicle={vehicle} />
        </div>

        {/* Trip Summary Sidebar */}
        <div className="lg:col-span-1">
          <TripSummarySidebar vehicle={vehicle} />
        </div>
      </div>
    </div>
  )
}
