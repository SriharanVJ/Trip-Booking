'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  MapPin,
  Users,
  Star,
  Wifi,
  Zap,
  Tv,
  Shield,
  Music,
  Package,
  ArrowRight,
  Calendar,
  Fuel,
  Heart,
  Share2,
  ChevronRight,
  Sparkles,
  Crown,
  Gem,
  Award,
  Clock,
  Wind,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Vehicle, VehicleAmenity } from '@/types'

interface VehicleCardProps {
  vehicle: Vehicle
  onViewDetails?: () => void
  variant?: 'default' | 'compact' | 'featured'
  priority?: boolean
}

const amenityIcons: Record<string, React.ReactNode> = {
  ac: <Wind className="h-3.5 w-3.5" />,
  wifi: <Wifi className="h-3.5 w-3.5" />,
  'charging-point': <Zap className="h-3.5 w-3.5" />,
  tv: <Tv className="h-3.5 w-3.5" />,
  toilet: <Shield className="h-3.5 w-3.5" />,
  'water-bottle': <Package className="h-3.5 w-3.5" />,
  blanket: <Package className="h-3.5 w-3.5" />,
  meal: <Package className="h-3.5 w-3.5" />,
  'music-system': <Music className="h-3.5 w-3.5" />,
  'first-aid-kit': <Shield className="h-3.5 w-3.5" />,
  'fire-extinguisher': <Shield className="h-3.5 w-3.5" />,
  gps: <MapPin className="h-3.5 w-3.5" />,
  'rear-camera': <Shield className="h-3.5 w-3.5" />,
  'pushback-seat': <Users className="h-3.5 w-3.5" />,
  bluetooth: <Music className="h-3.5 w-3.5" />,
  usb: <Zap className="h-3.5 w-3.5" />,
  'usb-charging': <Zap className="h-3.5 w-3.5" />,
  entertainment: <Tv className="h-3.5 w-3.5" />,
  'entertainment-system': <Tv className="h-3.5 w-3.5" />,
  'reading-light': <Zap className="h-3.5 w-3.5" />,
  'luggage-space': <Package className="h-3.5 w-3.5" />,
  'reclining-seat': <Users className="h-3.5 w-3.5" />,
  'reclining-seats': <Users className="h-3.5 w-3.5" />,
  'passenger-display': <Tv className="h-3.5 w-3.5" />,
  microphone: <Music className="h-3.5 w-3.5" />,
  refrigerator: <Package className="h-3.5 w-3.5" />,
}

const vehicleTypeConfig: Record<string, { label: string; gradient: string; icon: any; badgeClass: string; color: string }> = {
  car: {
    label: 'Premium Sedan',
    gradient: 'from-gold/20 to-gold/5',
    icon: Crown,
    badgeClass: 'border-gold/30 text-gold bg-gold/10',
    color: 'text-gold',
  },
  traveller: {
    label: 'Traveller',
    gradient: 'from-emerald-500/20 to-emerald-500/5',
    icon: Users,
    badgeClass: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10',
    color: 'text-emerald-400',
  },
  coach: {
    label: 'Luxury Coach',
    gradient: 'from-purple-500/20 to-purple-500/5',
    icon: Gem,
    badgeClass: 'border-purple-500/30 text-purple-400 bg-purple-500/10',
    color: 'text-purple-400',
  },
  bus: {
    label: 'Luxury Bus',
    gradient: 'from-blue-500/20 to-blue-500/5',
    icon: Award,
    badgeClass: 'border-blue-500/30 text-blue-400 bg-blue-500/10',
    color: 'text-blue-400',
  },
}

import { Bus, Car } from 'lucide-react'

export function VehicleCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden glass-luxury-card border-gold/10">
        <div className="flex">
          <Skeleton className="h-32 w-32 bg-charcoal-dark" />
          <CardContent className="p-4 flex-1 space-y-3">
            <Skeleton className="h-5 w-24 bg-charcoal-dark/50" />
            <Skeleton className="h-4 w-16 bg-charcoal-dark/30" />
            <Skeleton className="h-4 w-32 bg-charcoal-dark/30" />
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden glass-luxury-card border-gold/10">
      <Skeleton className="h-56 w-full bg-charcoal-dark" />
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-36 bg-charcoal-dark/50" />
          <Skeleton className="h-4 w-24 bg-charcoal-dark/30" />
        </div>
        <Skeleton className="h-4 w-16 bg-charcoal-dark/30" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full bg-charcoal-dark/30" />
          ))}
        </div>
        <Skeleton className="h-6 w-24 bg-charcoal-dark/30" />
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Skeleton className="h-12 w-full bg-charcoal-dark/30" />
      </CardFooter>
    </Card>
  )
}

export function VehicleCard({ vehicle, onViewDetails, variant = 'default', priority = false }: VehicleCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isFavorited, setIsFavorited] = useState(false)
  const searchParams = useSearchParams()

  const displayAmenities = vehicle.amenities.slice(0, 4)
  const remainingAmenities = vehicle.amenities.length - 4
  const typeConfig = vehicleTypeConfig[vehicle.type] || vehicleTypeConfig.car
  const TypeIcon = typeConfig.icon

  // Build booking URL with search params
  const buildBookingUrl = () => {
    const params = new URLSearchParams()
    params.set('book', 'true')

    // Preserve search params if available
    if (searchParams) {
      const origin = searchParams.get('origin')
      const destination = searchParams.get('destination')
      const date = searchParams.get('date')
      const passengers = searchParams.get('passengers')

      if (origin) params.set('origin', origin)
      if (destination) params.set('destination', destination)
      if (date) params.set('date', date)
      if (passengers) params.set('passengers', passengers)
    }

    return `/vehicles/${vehicle.id}?${params.toString()}`
  }

  const isFeatured = variant === 'featured'

  // Compact variant for list view
  if (variant === 'compact') {
    return (
      <Card
        className={cn(
          'group overflow-hidden transition-all duration-500',
          'glass-luxury-card border-gold/10',
          'hover:border-gold/30 hover:shadow-gold'
        )}
      >
        <Link href={`/vehicles/${vehicle.id}`}>
          <div className="flex">
            {/* Image */}
            <div className="relative w-48 h-32 overflow-hidden bg-black flex-shrink-0">
              {!imageLoaded && !imageError && (
                <Skeleton className="absolute inset-0 h-full w-full bg-charcoal-dark" />
              )}
              {imageError ? (
                <div className="flex items-center justify-center h-full bg-gradient-to-br from-charcoal to-black text-warm-white-dark/50">
                  <Car className="h-10 w-10 opacity-50" />
                </div>
              ) : (
                <>
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    priority={priority}
                    unoptimized={vehicle.imageUrl.startsWith('http')}
                    className={cn(
                      'object-cover transition-transform duration-700',
                      'group-hover:scale-110'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                </>
              )}

              {/* Type Badge */}
              <Badge
                className={cn(
                  'absolute top-3 left-3 px-3 py-1 text-xs font-semibold border backdrop-blur-sm',
                  typeConfig.badgeClass
                )}
              >
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
            </div>

            {/* Content */}
            <CardContent className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-display font-bold text-lg text-warm-white group-hover:text-gold transition-colors line-clamp-1">
                    {vehicle.name}
                  </h3>
                  {vehicle.rating && (
                    <div className="flex items-center gap-1 text-sm bg-gold/10 px-2 py-1 rounded-lg border border-gold/20">
                      <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                      <span className="font-semibold text-gold">{vehicle.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-warm-white-dark/60 mb-3">
                  {vehicle.make} {vehicle.model} • {vehicle.year}
                </p>

                {/* Key Specs */}
                <div className="flex items-center gap-4 text-xs text-warm-white-dark/60">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-gold/70" />
                    <span>{vehicle.seatingCapacity} seats</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fuel className="h-3.5 w-3.5 text-gold/70" />
                    <span>{vehicle.fuelType || 'Diesel'}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-3">
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-display font-bold text-gradient-gold">
                      Rs. {vehicle.basePrice.toLocaleString()}
                    </span>
                    <span className="text-xs text-warm-white-dark/60">/km</span>
                  </div>
                  {(vehicle as any).pricePerDay && (
                    <>
                      <span className="text-xs text-warm-white-dark/40">or</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-display font-bold text-warm-white">
                          Rs. {(vehicle as any).pricePerDay.toLocaleString()}
                        </span>
                        <span className="text-xs text-warm-white-dark/60">/day</span>
                      </div>
                    </>
                  )}
                </div>
                <Button
                  size="sm"
                  className="h-9 px-4 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-semibold rounded-lg shadow-gold shimmer-gold"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.href = buildBookingUrl()
                  }}
                >
                  Book Now
                </Button>
              </div>
            </CardContent>
          </div>
        </Link>
      </Card>
    )
  }

  // Default card variant
  return (
    <Card
      className={cn(
        'group overflow-hidden transition-all duration-500',
        'glass-luxury-card border-gold/10',
        'hover:border-gold/30 hover:shadow-gold-lg',
        isFeatured ? 'md:col-span-2 lg:col-span-1' : ''
      )}
    >
      <Link href={`/vehicles/${vehicle.id}`}>
        <div className="relative h-64 overflow-hidden bg-black">
          {!imageLoaded && !imageError && (
            <Skeleton className="absolute inset-0 h-full w-full bg-charcoal-dark" />
          )}
          {imageError ? (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-charcoal to-black text-warm-white-dark/50">
              <Car className="h-16 w-16 opacity-50" />
            </div>
          ) : (
            <>
              <Image
                src={vehicle.imageUrl}
                alt={vehicle.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={priority}
                className={cn(
                  'object-cover transition-transform duration-700',
                  'group-hover:scale-110'
                )}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />

              {/* Luxury Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
            </>
          )}

          {/* Top Left - Type Badge */}
          <div className="absolute top-5 left-5">
            <Badge
              className={cn(
                'px-4 py-2 border font-semibold shadow-gold backdrop-blur-sm',
                typeConfig.badgeClass
              )}
            >
              <TypeIcon className="h-3.5 w-3.5 mr-1.5" />
              {typeConfig.label}
            </Badge>
          </div>

          {/* Rating Badge */}
          {vehicle.rating && (
            <div className="absolute bottom-5 left-5 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 shadow-gold border border-gold/20">
              <Star className="h-4 w-4 fill-gold text-gold" />
              <span className="text-sm font-bold text-warm-white">{vehicle.rating.toFixed(1)}</span>
              {vehicle.reviewCount > 0 && (
                <span className="text-xs text-warm-white-dark/60">({vehicle.reviewCount})</span>
              )}
            </div>
          )}

          {/* Featured Badge */}
          {isFeatured && (
            <Badge className="absolute top-5 right-5 bg-gradient-to-r from-gold to-gold-light text-black border-0 shadow-gold-lg font-semibold">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-6 space-y-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/vehicles/${vehicle.id}`} className="flex-1">
            <h3 className="font-display font-bold text-xl text-warm-white mb-2 hover:text-gold transition-colors line-clamp-1">
              {vehicle.name}
            </h3>
            <p className="text-sm text-warm-white-dark/60 flex items-center gap-1.5">
              {vehicle.make} {vehicle.model} • {vehicle.year}
            </p>
          </Link>
        </div>

        {/* Key Specs */}
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2 text-warm-white-dark/60">
            <Users className="h-4 w-4 text-gold/70" />
            <span className="font-medium">{vehicle.seatingCapacity} seats</span>
          </div>
          <div className="flex items-center gap-2 text-warm-white-dark/60">
            <Fuel className="h-4 w-4 text-gold/70" />
            <span className="font-medium">{vehicle.fuelType || 'Diesel'}</span>
          </div>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap items-center gap-2">
          {displayAmenities.map((amenity) => (
            <div
              key={amenity}
              className="group/amenity bg-gold/5 hover:bg-gold/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-gold/20 hover:border-gold/30 transition-all cursor-help"
              title={amenity.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            >
              <span className="text-gold/70 group-hover/amenity:text-gold transition-colors">{amenityIcons[amenity]}</span>
            </div>
          ))}
          {remainingAmenities > 0 && (
            <Badge
              variant="outline"
              className="rounded-full text-xs border-gold/30 text-gold bg-gold/5 font-medium"
            >
              +{remainingAmenities}
            </Badge>
          )}
        </div>

        {/* Pricing */}
        <div className="flex flex-col gap-1 pt-4 border-t border-gold/10">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-display font-bold text-gradient-gold">
              Rs. {vehicle.basePrice.toLocaleString()}
            </span>
            <span className="text-sm text-warm-white-dark/60">/km</span>
          </div>
          {(vehicle as any).pricePerDay && (
            <>
              <span className="text-xs text-warm-white-dark/40">or</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-display font-bold text-warm-white">
                  Rs. {(vehicle as any).pricePerDay.toLocaleString()}
                </span>
                <span className="text-sm text-warm-white-dark/60">/day</span>
              </div>
            </>
          )}
        </div>

        {/* Availability Badge */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-gold-pulse"></div>
          <span className="text-xs text-emerald-400 font-medium tracking-wide">Available for booking</span>
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 flex gap-3">
        <Button
          variant="outline"
          className="flex-1 h-12 border-gold/40 hover:bg-gold/5 hover:border-gold/60 font-display font-medium rounded-xl transition-all duration-300 text-warm-white"
          onClick={() => (window.location.href = `/vehicles/${vehicle.id}`)}
        >
          View Details
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
        <Button
          className={cn(
            'flex-1 h-12 font-display font-medium rounded-xl',
            'bg-gradient-to-r from-gold to-gold-light text-black',
            'hover:from-gold-light hover:to-gold',
            'shadow-gold hover:shadow-gold-lg',
            'transition-all duration-300 shimmer-gold'
          )}
          onClick={() => {
            console.log('Book Now clicked, vehicle:', vehicle)
            console.log('vehicle.id:', vehicle.id)
            if (!vehicle.id) {
              console.error('Vehicle ID is missing!')
              alert('Error: Vehicle ID is missing. Please try again.')
              return
            }
            window.location.href = buildBookingUrl()
          }}
        >
          Book Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )
}
