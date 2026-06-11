'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bus as BusIcon, Clock, MapPin, Users, Star } from 'lucide-react'
import { formatTime, formatCurrency } from '@/lib/utils'

interface BusSearchResultProps {
  result: any
}

export function BusSearchResult({ result }: BusSearchResultProps) {
  const { bus, schedule, route } = result

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Bus Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <BusIcon className="h-6 w-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-lg">{bus.operator}</h3>
                <p className="text-sm text-gray-500">{bus.busNumber}</p>
              </div>
              {bus.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span>{bus.rating}</span>
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2">
              {bus.amenities.map((amenity: string) => (
                <Badge key={amenity} variant="secondary" className="text-xs">
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Center: Route & Timing */}
          <div className="flex items-center gap-4 flex-1">
            <div className="text-center">
              <p className="text-xl font-semibold">{formatTime(schedule.departureTime)}</p>
              <p className="text-sm text-gray-500">{route.origin}</p>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Clock className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                <p className="text-sm text-gray-500">{route.duration}h</p>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2"></div>
            </div>

            <div className="text-center">
              <p className="text-xl font-semibold">{formatTime(schedule.arrivalTime)}</p>
              <p className="text-sm text-gray-500">{route.destination}</p>
            </div>
          </div>

          {/* Right: Price & Action */}
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(schedule.price)}
            </p>
            <p className="text-sm text-gray-500 mb-3">per person</p>
            <Button className="w-full md:w-auto">View Seats</Button>
            <p className="text-xs text-gray-500 mt-2">
              {schedule.availableSeats} seats left
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
