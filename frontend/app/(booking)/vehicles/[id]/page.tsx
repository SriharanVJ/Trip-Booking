'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { VehicleDetails, VehicleDetailsSkeleton } from '@/components/vehicle/VehicleDetails'
import { AvailabilityCalendar, generateSampleAvailability } from '@/components/vehicle/AvailabilityCalendar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Crown, Sparkles, Shield, Star, Users, Award, Check, ArrowRight } from 'lucide-react'
import type { Vehicle } from '@/types'

// Sample data - in real app, this would come from API
const getSampleVehicle = (id: string): Vehicle | null => {
  const vehicles: Record<string, Vehicle> = {
    'v1': {
      id: 'v1',
      name: 'Toyota Innova Crysta',
      type: 'car',
      make: 'Toyota',
      model: 'Innova Crysta',
      year: 2023,
      seatingCapacity: 7,
      amenities: ['ac', 'wifi', 'charging-point', 'music-system', 'gps'],
      imageUrl: '/images/vehicles/innova-crysta.jpg',
      images: [
        '/images/vehicles/innova-crysta.jpg',
        '/images/vehicles/innova-crysta-2.jpg',
        '/images/vehicles/innova-crysta-3.jpg',
        '/images/vehicles/innova-crysta-4.jpg',
      ],
      rating: 4.8,
      reviewCount: 124,
      basePrice: 18,
      priceUnit: 'per-km',
      minCharge: 250,
      driverCharges: 500,
      features: [
        'Premium leather seats with adjustable headrests',
        'Spacious luggage compartment (343L capacity)',
        'Professional and experienced driver',
        '24/7 customer support and roadside assistance',
        'Real-time GPS tracking enabled',
        'Comprehensive insurance included',
        'Regular sanitization and maintenance',
      ],
      description:
        'Experience luxury travel with the Toyota Innova Crysta. This premium MPV offers the perfect blend of comfort, style, and performance, making it ideal for family vacations, business trips, and weekend getaways. The spacious interior ensures a comfortable journey for all passengers, while the powerful diesel engine delivers excellent fuel efficiency without compromising on performance.',
      specifications: {
        engine: '2.8L 4-Cylinder Diesel',
        fuelType: 'diesel',
        transmission: 'automatic',
        mileage: '11.4 kmpl',
        luggageCapacity: '343L',
      },
      available: true,
    },
    'v2': {
      id: 'v2',
      name: 'Force Traveller 3350',
      type: 'traveller',
      make: 'Force',
      model: 'Traveller 3350',
      year: 2022,
      seatingCapacity: 14,
      amenities: ['ac', 'charging-point', 'pushback-seat', 'music-system', 'first-aid-kit', 'fire-extinguisher'],
      imageUrl: '/images/vehicles/traveller.jpg',
      images: [
        '/images/vehicles/traveller.jpg',
        '/images/vehicles/traveller-2.jpg',
        '/images/vehicles/traveller-3.jpg',
      ],
      rating: 4.5,
      reviewCount: 89,
      basePrice: 24,
      priceUnit: 'per-km',
      minCharge: 300,
      driverCharges: 600,
      features: [
        'Pushback seats for enhanced comfort',
        'Ample legroom and headroom',
        'First aid kit included for safety',
        'Fire safety equipment as per regulations',
        'Experienced and trained driver',
        'Large luggage space',
        'Individual reading lights',
      ],
      description:
        'The Force Traveller 3350 is designed for group travel, offering comfortable seating for up to 14 passengers. With its powerful engine and reliable performance, it\'s perfect for corporate outings, family gatherings, pilgrimage tours, and school trips. The vehicle features pushback seats, individual AC vents, and a music system to keep your group comfortable and entertained throughout the journey.',
      specifications: {
        engine: '2.6L Common Rail Diesel',
        fuelType: 'diesel',
        transmission: 'manual',
        mileage: '9 kmpl',
        luggageCapacity: '500L',
      },
      available: true,
    },
    'v3': {
      id: 'v3',
      name: 'Volvo 9400XL Coach',
      type: 'coach',
      make: 'Volvo',
      model: '9400XL',
      year: 2023,
      seatingCapacity: 36,
      amenities: [
        'ac',
        'wifi',
        'charging-point',
        'tv',
        'toilet',
        'water-bottle',
        'blanket',
        'meal',
        'pushback-seat',
        'music-system',
        'first-aid-kit',
        'fire-extinguisher',
      ],
      imageUrl: '/images/vehicles/volvo-coach.jpg',
      images: [
        '/images/vehicles/volvo-coach.jpg',
        '/images/vehicles/volvo-coach-2.jpg',
        '/images/vehicles/volvo-coach-3.jpg',
        '/images/vehicles/volvo-coach-4.jpg',
        '/images/vehicles/volvo-coach-5.jpg',
      ],
      rating: 4.9,
      reviewCount: 256,
      basePrice: 35,
      priceUnit: 'per-km',
      minCharge: 500,
      driverCharges: 800,
      features: [
        'Luxury recliner seats with leg support',
        'Individual entertainment screens at each seat',
        'Onboard clean and maintained restrooms',
        'Complimentary meals and beverages',
        'High-speed WiFi connectivity throughout journey',
        'USB charging port at every seat',
        'Reading lights and AC controls',
        'Ample overhead and under-seat luggage storage',
        'GPS tracking and live location sharing',
        'Two professional drivers for long journeys',
      ],
      description:
        'Experience the pinnacle of luxury travel with the Volvo 9400XL Coach. This premium luxury coach is designed for discerning travelers who demand the best. Every seat is a business-class experience with personal entertainment, charging ports, and meal service. The onboard restroom ensures comfort on long-distance journeys. Perfect for corporate retreats, wedding groups, and premium tour packages.',
      specifications: {
        engine: '11L D11C Diesel',
        fuelType: 'diesel',
        transmission: 'automatic',
        mileage: '4.5 kmpl',
        length: '12 meters',
        width: '2.6 meters',
        height: '3.8 meters',
        luggageCapacity: '2000L',
      },
      available: true,
    },
    'v4': {
      id: 'v4',
      name: 'Mercedes Benz Sprinter',
      type: 'traveller',
      make: 'Mercedes-Benz',
      model: 'Sprinter',
      year: 2023,
      seatingCapacity: 9,
      amenities: ['ac', 'wifi', 'charging-point', 'gps', 'rear-camera', 'pushback-seat'],
      imageUrl: '/images/vehicles/sprinter.jpg',
      images: [
        '/images/vehicles/sprinter.jpg',
        '/images/vehicles/sprinter-2.jpg',
        '/images/vehicles/sprinter-3.jpg',
      ],
      rating: 4.7,
      reviewCount: 67,
      basePrice: 28,
      priceUnit: 'per-km',
      minCharge: 350,
      driverCharges: 600,
      features: [
        'Premium interior finish with quality materials',
        'Advanced safety features including multiple airbags',
        'Dual-zone climate control',
        'Spacious and flexible seating arrangement',
        'Parking sensors and rear camera',
        'Bluetooth connectivity',
        'Noise insulation for quiet cabin',
      ],
      description:
        'The Mercedes-Benz Sprinter combines luxury with functionality, making it the preferred choice for corporate travel and premium small group transfers. With its signature Mercedes build quality, advanced safety features, and premium interiors, every journey becomes a memorable experience.',
      specifications: {
        engine: '2.1L 4-Cylinder Diesel Turbo',
        fuelType: 'diesel',
        transmission: 'automatic',
        mileage: '12 kmpl',
        luggageCapacity: '400L',
      },
      available: true,
    },
    'v5': {
      id: 'v5',
      name: 'AC Seater Bus 52',
      type: 'bus',
      make: 'Tata',
      model: 'AC Seater',
      year: 2022,
      seatingCapacity: 52,
      amenities: ['ac', 'charging-point', 'pushback-seat', 'music-system', 'first-aid-kit', 'fire-extinguisher'],
      imageUrl: '/images/vehicles/ac-bus.jpg',
      images: [
        '/images/vehicles/ac-bus.jpg',
        '/images/vehicles/ac-bus-2.jpg',
      ],
      rating: 4.3,
      reviewCount: 142,
      basePrice: 42,
      priceUnit: 'per-km',
      minCharge: 800,
      driverCharges: 1000,
      features: [
        'Large group capacity (52 passengers)',
        'Comfortable pushback seats with armrests',
        'Individual AC vents for temperature control',
        'Ample under-seat and overhead luggage space',
        'Audio system for announcements',
        'Emergency exits as per safety norms',
        'Suspension designed for long-distance comfort',
      ],
      description:
        'Perfect for large groups, tours, and events. This 52-seater AC bus offers comfort, reliability, and economy for group travel. Whether it\'s a school excursion, corporate event, wedding group, or pilgrimage tour, this bus handles large groups efficiently while ensuring passenger comfort throughout the journey.',
      specifications: {
        engine: '6L Cummins Diesel',
        fuelType: 'diesel',
        transmission: 'manual',
        mileage: '5 kmpl',
        length: '12 meters',
        width: '2.4 meters',
        height: '3.5 meters',
        luggageCapacity: '3000L',
      },
      available: true,
    },
    'v6': {
      id: 'v6',
      name: 'Tempo Traveller 26',
      type: 'traveller',
      make: 'Force',
      model: 'Tempo Traveller',
      year: 2021,
      seatingCapacity: 26,
      amenities: ['ac', 'charging-point', 'pushback-seat', 'music-system', 'first-aid-kit', 'fire-extinguisher'],
      imageUrl: '/images/vehicles/tempo.jpg',
      images: [
        '/images/vehicles/tempo.jpg',
        '/images/vehicles/tempo-2.jpg',
      ],
      rating: 4.4,
      reviewCount: 98,
      basePrice: 26,
      priceUnit: 'per-km',
      minCharge: 400,
      driverCharges: 700,
      features: [
        'Pushback seats for comfort',
        'Music system with USB connectivity',
        'First aid kit included',
        'Fire extinguisher for safety',
        'Large windows for panoramic views',
        'Overhead storage racks',
        'AC with multiple vents',
      ],
      description:
        'An economical group travel solution, the Tempo Traveller 26 seater is perfect for medium-sized groups. Offering a balance of comfort and affordability, it\'s ideal for family outings, small corporate events, school trips, and pilgrimage tours where budget is a consideration but comfort cannot be compromised.',
      specifications: {
        engine: '2.6L FM 2.6 CR Diesel',
        fuelType: 'diesel',
        transmission: 'manual',
        mileage: '8 kmpl',
        luggageCapacity: '800L',
      },
      available: true,
    },
  }

  return vehicles[id] || null
}

export default function VehicleDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [availabilities, setAvailabilities] = useState<any[]>([])

  useEffect(() => {
    const id = params.id as string

    // Simulate API call
    setTimeout(() => {
      const foundVehicle = getSampleVehicle(id)
      setVehicle(foundVehicle || null)
      setLoading(false)

      if (foundVehicle) {
        setAvailabilities(generateSampleAvailability(new Date()))
      }
    }, 800)
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
                The vehicle you're looking for doesn't exist or has been removed from our premium collection.
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
