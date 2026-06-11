'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { MapPin, Calendar, Users, ArrowLeft } from 'lucide-react'
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicle/VehicleCard'
import { VehicleFilter } from '@/components/vehicle/VehicleFilter'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Vehicle, VehicleFilterParams } from '@/types'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilters, setActiveFilters] = useState<VehicleFilterParams>({})

  const origin = searchParams.get('origin') || ''
  const destination = searchParams.get('destination') || ''
  const date = searchParams.get('date') || ''
  const passengers = searchParams.get('passengers') || '1'

  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const allVehicles = [
        {
          id: '1',
          name: 'Toyota Innova Crysta',
          type: 'car',
          make: 'Toyota',
          model: 'Innova Crysta',
          year: 2023,
          seatingCapacity: 7,
          amenities: ['ac', 'wifi', 'music-system', 'gps'],
          imageUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800',
          images: [],
          rating: 4.8,
          reviewCount: 156,
          basePrice: 15,
          priceUnit: 'per-km',
          pricePerDay: 4000,
          minCharge: 1500,
          driverCharges: 500,
          features: ['Spacious interior', 'Comfortable seating', 'Pushback seats'],
          description: 'Premium 7-seater MPV perfect for family trips and outstation travel.',
          specifications: {
            engine: '2.4L Diesel',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '12 kmpl',
            luggageCapacity: '4 bags',
          },
          available: true,
        },
        {
          id: '2',
          name: 'Toyota Fortuner',
          type: 'car',
          make: 'Toyota',
          model: 'Fortuner',
          year: 2023,
          seatingCapacity: 7,
          amenities: ['ac', 'wifi', 'gps', 'first-aid-kit'],
          imageUrl: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800',
          images: [],
          rating: 4.9,
          reviewCount: 203,
          basePrice: 18,
          priceUnit: 'per-km',
          pricePerDay: 5000,
          minCharge: 2000,
          driverCharges: 600,
          features: ['Premium SUV experience', 'Off-road capability', 'Luxury interior'],
          description: 'Powerful and comfortable SUV for long journeys and adventure trips.',
          specifications: {
            engine: '2.8L Diesel',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '10 kmpl',
            luggageCapacity: '5 bags',
          },
          available: true,
        },
        {
          id: '3',
          name: 'Force Traveller 3350',
          type: 'traveller',
          make: 'Force',
          model: 'Traveller 3350',
          year: 2022,
          seatingCapacity: 14,
          amenities: ['ac', 'music-system', 'first-aid-kit'],
          imageUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800',
          images: [],
          rating: 4.5,
          reviewCount: 89,
          basePrice: 16,
          priceUnit: 'per-km',
          pricePerDay: 4500,
          minCharge: 2500,
          driverCharges: 700,
          features: ['Spacious seating', 'Good legroom', 'Large luggage space'],
          description: 'Reliable tempo traveller perfect for group tours and family outings.',
          specifications: {
            engine: '2.6L Diesel',
            fuelType: 'diesel',
            transmission: 'manual',
            mileage: '10 kmpl',
            luggageCapacity: '10 bags',
          },
          available: true,
        },
        {
          id: '4',
          name: 'Mercedes Benz Sprinter',
          type: 'traveller',
          make: 'Mercedes',
          model: 'Sprinter',
          year: 2023,
          seatingCapacity: 14,
          amenities: ['ac', 'wifi', 'charging-point', 'tv', 'music-system'],
          imageUrl: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800',
          images: [],
          rating: 4.9,
          reviewCount: 67,
          basePrice: 25,
          priceUnit: 'per-km',
          pricePerDay: 7000,
          minCharge: 4000,
          driverCharges: 1000,
          features: ['Luxury interiors', 'Recliner seats', 'Premium audio'],
          description: 'Premium luxury traveller for corporate groups and VIP travel.',
          specifications: {
            engine: '2.1L Diesel',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '12 kmpl',
            luggageCapacity: '12 bags',
          },
          available: true,
        },
        {
          id: '5',
          name: 'Tata Luxury Coach',
          type: 'coach',
          make: 'Tata',
          model: 'Luxura',
          year: 2022,
          seatingCapacity: 24,
          amenities: ['ac', 'wifi', 'charging-point', 'tv', 'water-bottle', 'blanket'],
          imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
          images: [],
          rating: 4.6,
          reviewCount: 112,
          basePrice: 22,
          priceUnit: 'per-km',
          pricePerDay: 6500,
          minCharge: 3500,
          driverCharges: 800,
          features: ['Pushback seats', 'Reading lights', 'AC vents'],
          description: 'Comfortable luxury coach for medium-sized groups and special occasions.',
          specifications: {
            engine: '6.7L Diesel',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '6 kmpl',
            luggageCapacity: '30 bags',
          },
          available: true,
        },
        {
          id: '6',
          name: 'Volvo 9400XL Multi-Axle',
          type: 'bus',
          make: 'Volvo',
          model: '9400XL',
          year: 2023,
          seatingCapacity: 52,
          amenities: ['ac', 'wifi', 'charging-point', 'tv', 'toilet', 'water-bottle', 'blanket'],
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
          images: [],
          rating: 4.8,
          reviewCount: 234,
          basePrice: 28,
          priceUnit: 'per-km',
          pricePerDay: 9000,
          minCharge: 5000,
          driverCharges: 1500,
          features: ['Pushback seats', 'Personal TV', 'USB charging', 'Reading lights'],
          description: 'Premium multi-axle Volvo coach with luxury amenities for long journeys.',
          specifications: {
            engine: 'D13C',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '5 kmpl',
            luggageCapacity: '50 bags',
          },
          available: true,
        },
        {
          id: '7',
          name: 'Scania Metrolink',
          type: 'bus',
          make: 'Scania',
          model: 'Metrolink',
          year: 2023,
          seatingCapacity: 45,
          amenities: ['ac', 'wifi', 'charging-point', 'tv', 'toilet'],
          imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=800',
          images: [],
          rating: 4.9,
          reviewCount: 178,
          basePrice: 30,
          priceUnit: 'per-km',
          pricePerDay: 10000,
          minCharge: 5500,
          driverCharges: 1500,
          features: ['Recliner seats', 'Personal TV', 'Ambient lighting'],
          description: 'Premium business class coach with executive features for corporate travel.',
          specifications: {
            engine: 'DC13',
            fuelType: 'diesel',
            transmission: 'automatic',
            mileage: '5 kmpl',
            luggageCapacity: '45 bags',
          },
          available: true,
        },
        {
          id: '8',
          name: 'Honda City',
          type: 'car',
          make: 'Honda',
          model: 'City',
          year: 2023,
          seatingCapacity: 5,
          amenities: ['ac', 'music-system', 'gps'],
          imageUrl: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800',
          images: [],
          rating: 4.7,
          reviewCount: 145,
          basePrice: 12,
          priceUnit: 'per-km',
          pricePerDay: 3000,
          minCharge: 1200,
          driverCharges: 400,
          features: ['Comfortable sedan', 'Good mileage', 'Smooth ride'],
          description: 'Comfortable sedan perfect for small groups and city travel.',
          specifications: {
            engine: '1.5L Petrol',
            fuelType: 'petrol',
            transmission: 'manual',
            mileage: '15 kmpl',
            luggageCapacity: '2 bags',
          },
          available: true,
        },
      ]
      setVehicles(allVehicles)
      setFilteredVehicles(allVehicles)
      setLoading(false)
    }, 1000)
  }, [origin, destination, date, passengers])

  const handleFilterChange = (filters: VehicleFilterParams) => {
    setActiveFilters(filters)
    let filtered = [...vehicles]

    if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
      filtered = filtered.filter(v => filters.vehicleTypes!.includes(v.type))
    }

    if (filters.seatingCapacity && filters.seatingCapacity.length > 0) {
      filtered = filtered.filter(v => filters.seatingCapacity!.includes(v.seatingCapacity))
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(v =>
        filters.amenities!.every(amenity => v.amenities.includes(amenity))
      )
    }

    setFilteredVehicles(filtered)
  }

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
                  {new Date(date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
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
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <VehicleFilter onFilterChange={handleFilterChange} />
            </div>
          </div>

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
                <p className="text-gray-500 mb-6">Try adjusting your filters</p>
                <Button variant="outline" onClick={() => { setActiveFilters({}); setFilteredVehicles(vehicles); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
