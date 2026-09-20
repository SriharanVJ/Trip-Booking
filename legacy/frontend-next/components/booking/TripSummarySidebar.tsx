'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users, Fuel, Clock, Crown } from 'lucide-react'
import type { Vehicle } from '@/types'

interface TripSummarySidebarProps {
  vehicle: Vehicle
  startDate?: string
  endDate?: string
  passengers?: number
  pickupLocation?: string
  dropLocation?: string
}

export function TripSummarySidebar({
  vehicle,
  startDate,
  endDate,
  passengers = 1,
  pickupLocation,
  dropLocation,
}: TripSummarySidebarProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Select date'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateDays = () => {
    if (!startDate || !endDate) return 1
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1
  }

  const days = calculateDays()
  const basePrice = vehicle.basePrice || 15
  const driverCharges = vehicle.driverCharges || 500
  const estimatedDistance = 250 // Sample distance in km

  const totalCost = (basePrice * estimatedDistance) + (driverCharges * days)

  return (
    <Card className="glass-luxury-card border-gold/20 sticky top-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gold">
          <Crown className="h-5 w-5" />
          Trip Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle */}
        <div className="flex items-start gap-4 pb-4 border-b border-gold/10">
          <div className="w-20 h-16 rounded-lg bg-charcoal-dark overflow-hidden flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center text-gold/30">
              <Crown className="h-8 w-8" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-warm-white truncate">{vehicle.name}</h4>
            <p className="text-sm text-warm-white-dark/60">
              {vehicle.make} {vehicle.model} • {vehicle.year}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-gold/10 text-gold border-gold/30">
                {vehicle.type}
              </Badge>
              <span className="text-xs text-warm-white-dark/60">
                {vehicle.seatingCapacity} seats
              </span>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-3">
          <h5 className="font-semibold text-warm-white text-sm">Trip Details</h5>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-warm-white-dark/60">Pickup</p>
              <p className="text-sm text-warm-white truncate">{pickupLocation || 'Select location'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-warm-white-dark/60">Drop-off</p>
              <p className="text-sm text-warm-white truncate">{dropLocation || 'Select location'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-warm-white-dark/60">Duration</p>
              <p className="text-sm text-warm-white">
                {formatDate(startDate)}
                {endDate && ` - ${formatDate(endDate)}`}
              </p>
              {days > 1 && (
                <p className="text-xs text-warm-white-dark/60">{days} days</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="h-4 w-4 text-gold/70 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-warm-white-dark/60">Passengers</p>
              <p className="text-sm text-warm-white">{passengers} guest{passengers !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {/* Estimated Cost */}
        <div className="bg-gold/5 rounded-xl p-4 border border-gold/20">
          <h5 className="font-semibold text-warm-white text-sm mb-3">Estimated Cost</h5>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-warm-white-dark/60">Distance (~{estimatedDistance} km)</span>
              <span className="text-warm-white">Rs. {(basePrice * estimatedDistance).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-warm-white-dark/60">Driver charges ({days} day{days !== 1 ? 's' : ''})</span>
              <span className="text-warm-white">Rs. {(driverCharges * days).toLocaleString()}</span>
            </div>
            {days > 1 && (
              <div className="flex justify-between">
                <span className="text-warm-white-dark/60">Multi-day discount</span>
                <span className="text-emerald-400">-Rs. {((days - 1) * 200).toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-gold/20 pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span className="text-gold">Total Estimate</span>
                <span className="text-lg text-gradient-gold">
                  Rs. {totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-warm-white-dark/50 mt-3">
            *Final price may vary based on actual distance and additional requirements
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-warm-white-dark/60">
            <Fuel className="h-3 w-3 text-gold/60" />
            <span>Fuel included</span>
          </div>
          <div className="flex items-center gap-1.5 text-warm-white-dark/60">
            <Clock className="h-3 w-3 text-gold/60" />
            <span>No waiting charges</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
