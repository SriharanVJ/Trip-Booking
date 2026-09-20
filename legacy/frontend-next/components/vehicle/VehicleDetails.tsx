'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Star,
  MapPin,
  Users,
  Zap,
  Wifi,
  ChevronLeft,
  ChevronRight,
  Shield,
  Music,
  Package,
  Fuel,
  Settings,
  Calendar,
  Clock,
  Check,
  Crown,
  Gem,
  Sparkles,
  Award,
  ArrowRight,
  Heart,
  Share2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Vehicle, VehicleAmenity } from '@/types'

interface VehicleDetailsProps {
  vehicle: Vehicle
  onBookNow?: () => void
}

const amenityInfo: Record<
  VehicleAmenity,
  { icon: React.ReactNode; label: string; description: string }
> = {
  ac: {
    icon: <Zap className="h-5 w-5" />,
    label: 'Air Conditioning',
    description: 'Premium climate control for comfortable travel',
  },
  wifi: {
    icon: <Wifi className="h-5 w-5" />,
    label: 'WiFi Connectivity',
    description: 'High-speed internet connectivity throughout journey',
  },
  'charging-point': {
    icon: <Zap className="h-5 w-5" />,
    label: 'Charging Points',
    description: 'USB ports at every seat for device charging',
  },
  tv: {
    icon: <Settings className="h-5 w-5" />,
    label: 'Entertainment System',
    description: 'TV and premium entertainment options',
  },
  toilet: {
    icon: <Shield className="h-5 w-5" />,
    label: 'Onboard Toilet',
    description: 'Clean and maintained restroom facilities',
  },
  'water-bottle': {
    icon: <Package className="h-5 w-5" />,
    label: 'Premium Water',
    description: 'Complimentary bottled water provided',
  },
  blanket: {
    icon: <Package className="h-5 w-5" />,
    label: 'Luxury Blankets',
    description: 'Premium comfort blankets for long journeys',
  },
  meal: {
    icon: <Package className="h-5 w-5" />,
    label: 'Gourmet Meal Service',
    description: 'Complimentary meals and beverages',
  },
  'music-system': {
    icon: <Music className="h-5 w-5" />,
    label: 'Premium Audio',
    description: 'High-fidelity music and entertainment system',
  },
  'first-aid-kit': {
    icon: <Shield className="h-5 w-5" />,
    label: 'First Aid Kit',
    description: 'Comprehensive emergency medical supplies',
  },
  'fire-extinguisher': {
    icon: <Shield className="h-5 w-5" />,
    label: 'Fire Safety',
    description: 'Advanced fire safety equipment',
  },
  gps: {
    icon: <MapPin className="h-5 w-5" />,
    label: 'GPS Navigation',
    description: 'Real-time tracking and navigation system',
  },
  'rear-camera': {
    icon: <Shield className="h-5 w-5" />,
    label: 'Rear Camera',
    description: '360-degree parking and safety assistance',
  },
  'pushback-seat': {
    icon: <Users className="h-5 w-5" />,
    label: 'Pushback Seats',
    description: 'Luxury reclining seats with leg support',
  },
}

export function VehicleDetailsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 bg-black min-h-screen">
      <Skeleton className="h-8 w-64 mb-6 bg-charcoal-dark/50" />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-96 w-full rounded-2xl bg-charcoal-dark/30" />
          <Skeleton className="h-64 w-full rounded-2xl bg-charcoal-dark/30" />
          <Skeleton className="h-48 w-full rounded-2xl bg-charcoal-dark/30" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-2xl bg-charcoal-dark/30" />
          <Skeleton className="h-64 w-full rounded-2xl bg-charcoal-dark/30" />
        </div>
      </div>
    </div>
  )
}

function ImageGallery({ images, vehicleName }: { images: string[]; vehicleName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <div className="relative animate-fade-in-up-luxury">
      <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-charcoal-dark border border-gold/10">
        <Image
          src={images[currentIndex]}
          alt={`${vehicleName} - View ${currentIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
          priority={currentIndex === 0} // Priority for first image
          unoptimized={images[currentIndex].startsWith('http')}
          className="object-cover transition-transform duration-700 hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-3 rounded-full shadow-gold border border-gold/20 transition-all hover:scale-110"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5 text-gold" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-sm hover:bg-black/80 p-3 rounded-full shadow-gold border border-gold/20 transition-all hover:scale-110"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5 text-gold" />
            </button>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full border border-gold/20">
              <span className="text-sm font-semibold text-gold">
                {currentIndex + 1} / {images.length}
              </span>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-3 rounded-full shadow-gold border border-gold/20 transition-all hover:scale-110">
            <Heart className="h-4 w-4 text-warm-white-dark/70 hover:text-gold transition-colors" />
          </button>
          <button className="bg-black/60 backdrop-blur-sm hover:bg-black/80 p-3 rounded-full shadow-gold border border-gold/20 transition-all hover:scale-110">
            <Share2 className="h-4 w-4 text-warm-white-dark/70 hover:text-gold transition-colors" />
          </button>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      {images.length > 1 && (
        <ScrollArea className="mt-6 w-full">
          <div className="flex gap-3 pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  'relative flex-shrink-0 w-28 h-20 rounded-xl overflow-hidden border-2 transition-all hover:scale-105',
                  index === currentIndex
                    ? 'border-gold shadow-gold'
                    : 'border-gold/10 hover:border-gold/30'
                )}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="112px"
                  unoptimized={image.startsWith('http')}
                  className="object-cover"
                />
                {index === currentIndex && (
                  <div className="absolute inset-0 bg-gold/20" />
                )}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}

function SpecificationsTable({
  vehicle,
}: {
  vehicle: Vehicle
}) {
  const specs = [
    { label: 'Make', value: vehicle.make, icon: <Crown className="h-4 w-4 text-gold" /> },
    { label: 'Model', value: vehicle.model, icon: <Gem className="h-4 w-4 text-gold" /> },
    { label: 'Year', value: vehicle.year.toString(), icon: <Calendar className="h-4 w-4 text-gold" /> },
    { label: 'Seating', value: `${vehicle.seatingCapacity} passengers`, icon: <Users className="h-4 w-4 text-gold" /> },
    { label: 'Engine', value: vehicle.specifications.engine, icon: <Settings className="h-4 w-4 text-gold" /> },
    { label: 'Fuel Type', value: vehicle.specifications.fuelType, icon: <Fuel className="h-4 w-4 text-gold" /> },
    { label: 'Transmission', value: vehicle.specifications.transmission, icon: <Settings className="h-4 w-4 text-gold" /> },
    { label: 'Mileage', value: vehicle.specifications.mileage, icon: <Fuel className="h-4 w-4 text-gold" /> },
    { label: 'Luggage', value: vehicle.specifications.luggageCapacity, icon: <Package className="h-4 w-4 text-gold" /> },
  ]

  if (vehicle.specifications.length) {
    specs.push({ label: 'Length', value: vehicle.specifications.length!, icon: <Settings className="h-4 w-4 text-gold" /> })
  }
  if (vehicle.specifications.width) {
    specs.push({ label: 'Width', value: vehicle.specifications.width!, icon: <Settings className="h-4 w-4 text-gold" /> })
  }
  if (vehicle.specifications.height) {
    specs.push({ label: 'Height', value: vehicle.specifications.height!, icon: <Settings className="h-4 w-4 text-gold" /> })
  }

  return (
    <Card className="glass-luxury-card border-gold/10">
      <CardHeader className="border-b border-gold/10">
        <CardTitle className="flex items-center gap-2 text-gold">
          <Award className="h-5 w-5" />
          Premium Specifications
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-6">
          {specs.map((spec) => (
            <div key={spec.label} className="flex items-start gap-3 p-3 rounded-xl bg-gold/5 hover:bg-gold/10 transition-colors border border-gold/10">
              <div className="mt-0.5">{spec.icon}</div>
              <div className="flex-1">
                <p className="text-xs text-warm-white-dark/60 uppercase tracking-wide mb-1">{spec.label}</p>
                <p className="font-semibold text-warm-white">{spec.value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AmenitiesList({ amenities }: { amenities: VehicleAmenity[] }) {
  return (
    <Card className="glass-luxury-card border-gold/10">
      <CardHeader className="border-b border-gold/10">
        <CardTitle className="flex items-center gap-2 text-gold">
          <Sparkles className="h-5 w-5" />
          Luxury Amenities
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-4">
          {amenities.map((amenity) => (
            <div
              key={amenity}
              className="group flex items-start gap-4 p-4 rounded-xl bg-gold/5 hover:bg-gold/10 border border-gold/10 hover:border-gold/20 transition-all"
            >
              <div className="flex-shrink-0 p-3 rounded-xl bg-gold/10 border border-gold/20 group-hover:border-gold/30 transition-colors">
                <div className="text-gold">{amenityInfo[amenity].icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-warm-white group-hover:text-gold transition-colors mb-1">
                  {amenityInfo[amenity].label}
                </h4>
                <p className="text-sm text-warm-white-dark/60 leading-relaxed">
                  {amenityInfo[amenity].description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function PricingBreakdown({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Card className="glass-luxury-card border-gold/10">
      <CardHeader className="border-b border-gold/10">
        <CardTitle className="flex items-center gap-2 text-gold">
          <Crown className="h-5 w-5" />
          Premium Pricing
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-warm-white-dark/60">Per Kilometer</span>
          <span className="font-semibold text-warm-white">
            Rs. {vehicle.basePrice} /km
          </span>
        </div>
        {(vehicle as any).pricePerDay && (
          <div className="flex justify-between items-center py-2">
            <span className="text-warm-white-dark/60">Per Day</span>
            <span className="font-semibold text-warm-white">
              Rs. {(vehicle as any).pricePerDay.toLocaleString()} /day
            </span>
          </div>
        )}
        <div className="flex justify-between items-center py-2">
          <span className="text-warm-white-dark/60">Minimum Charge</span>
          <span className="font-semibold text-warm-white">Rs. {vehicle.minCharge}</span>
        </div>
        <div className="flex justify-between items-center py-2">
          <span className="text-warm-white-dark/60">Driver Charges</span>
          <span className="font-semibold text-warm-white">Rs. {vehicle.driverCharges} / day</span>
        </div>
        <Separator className="bg-gold/10" />
        <div className="flex justify-between items-center py-3 text-xl">
          <span className="font-semibold text-warm-white">Starting from</span>
          <span className="font-display font-bold text-gradient-gold">
            Rs. {(vehicle.basePrice + vehicle.driverCharges).toLocaleString()}
          </span>
        </div>
        <p className="text-xs text-warm-white-dark/50 leading-relaxed">
          * Choose per-km for distance-based pricing or per-day for full-day rentals
        </p>
      </CardContent>
    </Card>
  )
}

function FeaturesHighlights({ features }: { features: string[] }) {
  return (
    <Card className="glass-luxury-card border-gold/10">
      <CardHeader className="border-b border-gold/10">
        <CardTitle className="flex items-center gap-2 text-gold">
          <Gem className="h-5 w-5" />
          Premium Features
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li
              key={index}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-gold/5 transition-colors"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center mt-0.5">
                <Check className="h-3.5 w-3.5 text-gold" />
              </div>
              <span className="text-sm text-warm-white-dark/80 leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function ReviewsSection({
  rating,
  reviewCount,
}: {
  rating: number
  reviewCount: number
}) {
  const [showAllReviews, setShowAllReviews] = useState(false)

  // Sample reviews - in real app, these would come from API
  const sampleReviews = [
    {
      id: '1',
      userName: 'Rajesh Kumar',
      rating: 5,
      title: 'Exceptional luxury experience',
      comment: 'The vehicle exceeded all expectations. Premium comfort, professional service, and attention to detail throughout the journey. Truly a distinguished travel experience.',
      date: '2 days ago',
      helpful: 12,
      avatar: 'RK',
    },
    {
      id: '2',
      userName: 'Priya Sharma',
      rating: 5,
      title: 'Outstanding service quality',
      comment: 'From booking to completion, every aspect was handled with sophistication. The vehicle was immaculate and the driver was courteous and professional.',
      date: '1 week ago',
      helpful: 8,
      avatar: 'PS',
    },
  ]

  return (
    <Card className="glass-luxury-card border-gold/10">
      <CardHeader className="border-b border-gold/10">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gold">
            <Star className="h-5 w-5 fill-gold" />
            Distinguished Reviews
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gold/10 px-3 py-1.5 rounded-full border border-gold/30">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="text-lg font-bold text-gold">{rating.toFixed(1)}</span>
            </div>
            <span className="text-sm text-warm-white-dark/60">
              ({reviewCount} reviews)
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {sampleReviews.map((review) => (
            <div key={review.id} className="border-b border-gold/10 pb-6 last:border-0 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center text-gold font-display font-bold border border-gold/30">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-warm-white">{review.userName}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= review.rating
                              ? 'fill-gold text-gold'
                              : 'text-warm-white-dark/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-warm-white-dark/50">{review.date}</span>
              </div>
              <h5 className="font-semibold text-warm-white mb-2">{review.title}</h5>
              <p className="text-sm text-warm-white-dark/70 leading-relaxed mb-3">{review.comment}</p>
              <button className="text-xs text-gold hover:text-gold-light transition-colors flex items-center gap-1">
                <Check className="h-3.5 w-3.5" />
                Helpful ({review.helpful})
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BookingCard({ vehicle, onBookNow }: { vehicle: Vehicle; onBookNow?: () => void }) {
  const [isFavorited, setIsFavorited] = useState(false)

  return (
    <Card className="glass-luxury-card border-gold/20 sticky top-4 shadow-luxury-lg">
      <CardHeader className="border-b border-gold/10">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gold">
            <Crown className="h-5 w-5" />
            Reserve Your Journey
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9"
            onClick={() => setIsFavorited(!isFavorited)}
          >
            <Heart
              className={`h-5 w-5 ${isFavorited ? 'fill-gold text-gold' : 'text-warm-white-dark/50'}`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Date Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-warm-white mb-2 block">
              Pickup Date
            </label>
            <input
              type="date"
              className="w-full h-12 rounded-xl bg-charcoal-dark/50 border border-gold/20 text-warm-white px-4 py-3 text-sm focus:border-gold/40 focus:ring-0 transition-colors cursor-pointer"
              style={{ userSelect: 'none' }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-warm-white mb-2 block">
              Return Date
            </label>
            <input
              type="date"
              className="w-full h-12 rounded-xl bg-charcoal-dark/50 border border-gold/20 text-warm-white px-4 py-3 text-sm focus:border-gold/40 focus:ring-0 transition-colors cursor-pointer"
              style={{ userSelect: 'none' }}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <PricingBreakdown vehicle={vehicle} />

        <Separator className="bg-gold/10" />

        {/* Trust Badges */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-gold" />
            </div>
            <span className="text-warm-white-dark/70">Free cancellation up to 24 hours</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-gold" />
            </div>
            <span className="text-warm-white-dark/70">Transparent pricing, no hidden charges</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-6 h-6 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center flex-shrink-0">
              <Check className="h-3.5 w-3.5 text-gold" />
            </div>
            <span className="text-warm-white-dark/70">Verified professional drivers</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold text-lg rounded-2xl shadow-gold-lg shimmer-gold"
            onClick={onBookNow}
          >
            Book This Vehicle
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 bg-transparent text-gold border-2 border-gold/30 hover:bg-gold/10 hover:border-gold/50 font-display font-medium rounded-xl transition-all"
          >
            Contact Concierge
          </Button>
        </div>

        {/* Support Info */}
        <div className="text-center p-4 bg-gold/5 rounded-xl border border-gold/10">
          <p className="text-xs text-warm-white-dark/60 mb-1">Need assistance?</p>
          <p className="text-sm text-gold font-semibold">24/7 Premium Support Available</p>
        </div>
      </CardContent>
    </Card>
  )
}

export function VehicleDetails({ vehicle, onBookNow }: VehicleDetailsProps) {
  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="border-b border-gold/10 bg-charcoal-dark/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-warm-white-dark/60">
            <span className="hover:text-gold transition-colors cursor-pointer">Home</span>
            <span className="text-gold/30">/</span>
            <span className="hover:text-gold transition-colors cursor-pointer">Vehicles</span>
            <span className="text-gold/30">/</span>
            <span className="text-gold font-medium">{vehicle.name}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Header Section */}
            <div className="space-y-6 animate-fade-in-up-luxury">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <Badge className="mb-4 badge-gold-solid">
                    <Crown className="h-3.5 w-3.5 mr-1" />
                    Premium Collection
                  </Badge>
                  <h1 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-3">
                    {vehicle.name}
                  </h1>
                  <p className="text-lg text-warm-white-dark/60 flex items-center gap-2">
                    {vehicle.make} {vehicle.model} • {vehicle.year}
                  </p>
                </div>
              </div>

              {/* Key Stats */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 bg-gold/10 px-4 py-2 rounded-xl border border-gold/20">
                  <Star className="h-5 w-5 fill-gold text-gold" />
                  <span className="font-display font-bold text-gold">{vehicle.rating.toFixed(1)}</span>
                  <span className="text-sm text-warm-white-dark/60">({vehicle.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2 text-warm-white-dark/60">
                  <Users className="h-5 w-5 text-gold" />
                  <span className="font-medium">{vehicle.seatingCapacity} Seats</span>
                </div>
                <div className="flex items-center gap-2 text-warm-white-dark/60">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-gold-pulse"></div>
                  <span className="font-medium">Available Now</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <ImageGallery images={vehicle.images} vehicleName={vehicle.name} />

            {/* Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="glass-luxury-card border-gold/20 p-1 grid w-full grid-cols-4 h-12">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-xl transition-all"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="specs"
                  className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-xl transition-all"
                >
                  Specifications
                </TabsTrigger>
                <TabsTrigger
                  value="amenities"
                  className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-xl transition-all"
                >
                  Amenities
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-xl transition-all"
                >
                  Reviews
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6 animate-fade-in-up-luxury">
                <Card className="glass-luxury-card border-gold/10">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-5 w-5 text-gold" />
                      <h3 className="font-display font-semibold text-xl text-warm-white">
                        About This Vehicle
                      </h3>
                    </div>
                    <p className="text-warm-white-dark/70 leading-relaxed text-lg">
                      {vehicle.description}
                    </p>
                  </CardContent>
                </Card>
                <FeaturesHighlights features={vehicle.features} />
              </TabsContent>

              <TabsContent value="specs" className="mt-6 animate-fade-in-up-luxury">
                <SpecificationsTable vehicle={vehicle} />
              </TabsContent>

              <TabsContent value="amenities" className="mt-6 animate-fade-in-up-luxury">
                <AmenitiesList amenities={vehicle.amenities} />
              </TabsContent>

              <TabsContent value="reviews" className="mt-6 animate-fade-in-up-luxury">
                <ReviewsSection
                  rating={vehicle.rating}
                  reviewCount={vehicle.reviewCount}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <BookingCard vehicle={vehicle} onBookNow={onBookNow} />
          </div>
        </div>
      </div>
    </div>
  )
}
