'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { VehicleDetails, VehicleDetailsSkeleton } from '@/components/vehicle/VehicleDetails'
import { AvailabilityCalendar, generateSampleAvailability } from '@/components/vehicle/AvailabilityCalendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles, Shield, Star, Users, Award, Check, ArrowRight } from 'lucide-react'
import type { Vehicle } from '@/types'
import { vehicleApi } from '@/lib/api'

export default function VehicleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [availabilities, setAvailabilities] = useState<any[]>([])

  useEffect(() => {
    const loadVehicle = async () => {
      const id = params.id as string
      console.log('Loading vehicle with ID:', id)

      try {
        setLoading(true)
        setError(null)

        console.log('Calling API...')
        // Fetch vehicle from API
        const response = await vehicleApi.getVehicle(id)
        console.log('API response:', response.data)

        // Transform API response to match Vehicle type
        const vehicleData: Vehicle = {
          id: response.data.id,
          name: response.data.name,
          type: response.data.type,
          make: response.data.make,
          model: response.data.model,
          year: response.data.year,
          seatingCapacity: response.data.seatingCapacity,
          amenities: response.data.amenities || [],
          imageUrl: response.data.thumbnailImage || response.data.images?.[0] || '/images/placeholder-vehicle.jpg',
          images: response.data.images || [],
          rating: response.data.rating || 4.5,
          reviewCount: response.data.reviewCount || 0,
          basePrice: response.data.pricePerKm,
          priceUnit: 'per-km',
          minCharge: response.data.minimumCharge,
          driverCharges: response.data.driverAllowancePerDay,
          features: response.data.features?.features || [],
          description: response.data.description || '',
          specifications: response.data.specifications || {},
          available: response.data.isAvailable !== false,
          fuelType: response.data.fuelType || 'DIESEL',
          pricePerDay: response.data.pricePerDay,
        }

        console.log('Transformed vehicle data:', vehicleData)
        setVehicle(vehicleData)
        setAvailabilities(generateSampleAvailability(new Date()))

        // If book=true query param is set, redirect to booking page with search params
        if (searchParams.get('book') === 'true') {
          // Build booking URL with preserved search params
          const bookingParams = new URLSearchParams()

          // Preserve search params from the current URL
          const origin = searchParams.get('origin')
          const destination = searchParams.get('destination')
          const date = searchParams.get('date')
          const passengers = searchParams.get('passengers')

          if (origin) bookingParams.set('origin', origin)
          if (destination) bookingParams.set('destination', destination)
          if (date) bookingParams.set('date', date)
          if (passengers) bookingParams.set('passengers', passengers)

          const bookingUrl = `/book/${params.id}${bookingParams.toString() ? '?' + bookingParams.toString() : ''}`
          router.push(bookingUrl)
        }
      } catch (err) {
        console.error('Failed to load vehicle:', err)
        console.error('Error details:', (err as any)?.response?.data || (err as any)?.message)
        setError('Failed to load vehicle details. Please try again later.')
        setVehicle(null)
      } finally {
        setLoading(false)
      }
    }

    loadVehicle()
  }, [params.id])

  const handleBookNow = () => {
    router.push(`/book/${params.id}`)
  }

  const handleDateRangeSelect = (startDate: Date, endDate: Date) => {
    router.push(
      `/book/${params.id}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
    )
  }

  if (loading) {
    return <VehicleDetailsSkeleton />
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-24 border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-charcoal-dark to-black">
            <div className="absolute inset-0 bg-gradient-luxury-mesh"></div>
            <div className="absolute inset-0 pattern-luxury-grid opacity-20"></div>
          </div>

          <div className="relative container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <Badge className="mb-6 glass-luxury border-gold text-gold">
                <Shield className="w-4 h-4 mr-1" />
                Vehicle Not Found
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-6">
                Vehicle Unavailable
              </h1>
              <p className="text-lg text-warm-white-dark/70 mb-10 leading-relaxed">
                The vehicle you&apos;re looking for doesn&apos;t exist or has been removed from our premium collection.
              </p>
              <Button
                className="h-14 px-8 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
                onClick={() => router.push('/vehicles')}
              >
                Browse Premium Fleet
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <>
      <VehicleDetails vehicle={vehicle} onBookNow={handleBookNow} />

      {/* Availability Section */}
      <section className="relative py-16 border-t border-gold/10">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-charcoal-dark"></div>
        <div className="relative container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 animate-fade-in-up-luxury">
              <div className="flex items-center gap-2 mb-6">
                <Crown className="h-6 w-6 text-gold" />
                <h2 className="font-display text-3xl font-bold text-warm-white">
                  Check Availability
                </h2>
              </div>
              <p className="text-warm-white-dark/70 mb-8 leading-relaxed">
                Select your preferred travel dates to check real-time availability and receive an instant quote.
                Green dates indicate the vehicle is available for booking.
              </p>
              <div className="glass-luxury-card rounded-2xl p-6 border-gold/10">
                <AvailabilityCalendar
                  availabilities={availabilities}
                  onDateRangeSelect={handleDateRangeSelect}
                />
              </div>
            </div>

            {/* Why Book With Us Card */}
            <div className="animate-fade-in-up-luxury" style={{ animationDelay: '0.1s' }}>
              <Card className="glass-luxury-card border-gold/20 sticky top-4">
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="font-display font-semibold text-xl text-gold mb-2 flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Why Book With Us?
                    </h3>
                    <p className="text-sm text-warm-white-dark/60">
                      Experience the AJ Holidays difference
                    </p>
                  </div>

                  <ul className="space-y-4">
                    {[
                      { icon: Check, text: 'Transparent luxury pricing with no hidden charges' },
                      { icon: Shield, text: 'Verified and meticulously maintained vehicles' },
                      { icon: Users, text: 'Professional, experienced chauffeurs' },
                      { icon: Award, text: '24/7 premium concierge support' },
                      { icon: Star, text: 'Comprehensive insurance included' },
                      { icon: Crown, text: 'Exclusive member benefits and rewards' },
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mt-0.5">
                          <item.icon className="h-3.5 w-3.5 text-gold" />
                        </div>
                        <span className="text-sm text-warm-white-dark/80 leading-relaxed">{item.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="p-5 bg-gold/5 rounded-xl border border-gold/20">
                    <p className="text-sm text-center text-warm-white-dark/70 mb-4">
                      Need personalized assistance?
                    </p>
                    <Button
                      variant="outline"
                      className="w-full bg-transparent text-gold border-2 border-gold/30 hover:bg-gold/10 hover:border-gold/50 font-display font-medium rounded-xl transition-all"
                    >
                      Contact Premium Support
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-24 border-t border-gold/20">
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-dark to-black">
          <div className="absolute inset-0 bg-gradient-luxury-mesh"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto animate-fade-in-up-luxury">
            <Badge className="mb-6 glass-luxury border-gold text-gold">
              <Crown className="w-4 h-4 mr-1" />
              Premium Experience
            </Badge>

            <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-6">
              Ready to Begin Your Journey?
            </h2>

            <p className="text-lg text-warm-white-dark/70 mb-10 leading-relaxed">
              Our dedicated travel consultants are available 24/7 to assist you in planning the perfect luxury travel experience.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
                onClick={() => router.push('/vehicles')}
              >
                Explore More Vehicles
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 bg-transparent text-gold border-2 border-gold/40 hover:bg-gold/10 hover:border-gold/60 font-display font-semibold rounded-xl backdrop-blur transition-all"
              >
                Speak with Consultant
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
