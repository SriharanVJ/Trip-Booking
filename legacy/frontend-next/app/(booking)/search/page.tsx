'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react'
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicle/VehicleCard'
import { Button } from '@/components/ui/button'
import type { Vehicle } from '@/types'
import { vehicleApi } from '@/lib/api'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const origin = searchParams.get('origin') || ''
  const destination = searchParams.get('destination') || ''
  const date = searchParams.get('date') || ''
  const passengers = searchParams.get('passengers') || '1'

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('Loading vehicles from API...')
        // Fetch vehicles from API
        const response = await vehicleApi.getVehicles()
        console.log('Vehicles API response:', response.data)

        // Transform amenities from backend format to frontend format
        const transformAmenities = (apiAmenities: string[]) => {
          const amenityMap: Record<string, string> = {
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
          return apiAmenities.map(a => amenityMap[a] || a.toLowerCase().replace(/_/g, '-').replace(/ /g, '-'))
        }

        // Transform API response to match Vehicle type
        const vehiclesData = response.data.map((v: any) => {
          console.log('Processing vehicle:', v.id, v.name)
          return {
            id: v.id,
            name: v.name,
            type: v.type,
            make: v.make,
            model: v.model,
            year: v.year,
            seatingCapacity: v.seatingCapacity,
            amenities: transformAmenities(v.amenities || []),
            imageUrl: v.thumbnailImage || v.images?.[0] || '/images/placeholder-vehicle.jpg',
            images: v.images || [],
            rating: v.rating || 4.5,
            reviewCount: v.reviewCount || 0,
            basePrice: v.pricePerKm,
            priceUnit: 'per-km',
            minCharge: v.minimumCharge,
            driverCharges: v.driverAllowancePerDay,
            features: v.features?.features || [],
            description: v.description || '',
            specifications: v.specifications || {},
            available: v.isAvailable !== false,
            fuelType: v.fuelType || 'DIESEL',
            pricePerDay: v.pricePerDay,
          }
        })

        console.log('Transformed vehicles:', vehiclesData)
        setVehicles(vehiclesData)
        setFilteredVehicles(vehiclesData)
      } catch (err) {
        console.error('Failed to load vehicles:', err)
        setError('Failed to load vehicles. Please try again later.')
        setVehicles([])
        setFilteredVehicles([])
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <span>{origin}</span>
                <span className="text-gray-400">→</span>
                <span>{destination}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {date ? new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  }) : 'Select date'}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {passengers} {passengers === '1' ? 'Passenger' : 'Passengers'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Results */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {filteredVehicles.length} {filteredVehicles.length === 1 ? 'Vehicle' : 'Vehicles'} Available
              </h1>
            </div>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <VehicleCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles found</h3>
              <p className="text-gray-500 mb-6">No vehicles available for this route</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  priority={index < 6}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
