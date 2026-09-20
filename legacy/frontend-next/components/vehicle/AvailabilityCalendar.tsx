'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import type { VehicleAvailability } from '@/types'

interface AvailabilityCalendarProps {
  availabilities: VehicleAvailability[]
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void
  minDate?: Date
  maxDate?: Date
}

export function AvailabilityCalendar({
  availabilities,
  onDateRangeSelect,
  minDate = new Date(),
  maxDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
}: AvailabilityCalendarProps) {
  const [selectedRange, setSelectedRange] = useState<{
    start: Date | null
    end: Date | null
  }>({ start: null, end: null })

  // Create a map of availability dates for quick lookup
  const availabilityMap = useMemo(() => {
    const map = new Map<string, VehicleAvailability>()
    availabilities.forEach((avail) => {
      map.set(avail.date, avail)
    })
    return map
  }, [availabilities])

  // Disable dates that are not available
  const isDateUnavailable = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    const availability = availabilityMap.get(dateStr)
    return !availability || !availability.available
  }

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setSelectedRange({ start: null, end: null })
      return
    }

    const start = range.from || null
    const end = range.to || null

    setSelectedRange({ start, end })

    if (start && end) {
      onDateRangeSelect?.(start, end)
    }
  }

  const totalCost = useMemo(() => {
    if (!selectedRange.start || !selectedRange.end) return null

    const [start, end] = [selectedRange.start, selectedRange.end].sort(
      (a, b) => a.getTime() - b.getTime()
    )

    let total = 0
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const availability = availabilityMap.get(dateStr)
      if (availability && availability.available && availability.price) {
        total += availability.price
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    return { total, days }
  }, [selectedRange, availabilityMap])

  const clearSelection = () => {
    setSelectedRange({ start: null, end: null })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Check Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-red-100 border border-red-300" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-primary" />
            <span>Selected</span>
          </div>
        </div>

        {/* Calendar */}
        <Calendar
          mode="range"
          selected={selectedRange.start && selectedRange.end ? {
            from: selectedRange.start,
            to: selectedRange.end
          } : selectedRange.start ? {
            from: selectedRange.start,
            to: selectedRange.start
          } : undefined}
          onSelect={handleSelect}
          disabled={isDateUnavailable}
          fromDate={minDate}
          toDate={maxDate}
          numberOfMonths={window.innerWidth < 768 ? 1 : 2}
          className="rounded-md border"
        />

        {/* Selection Summary */}
        {selectedRange.start && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Selected Dates</p>
                  <p className="font-medium">
                    {selectedRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {selectedRange.end && (
                      <> - {selectedRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</>
                    )}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>

              {totalCost && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {totalCost.days} {totalCost.days === 1 ? 'day' : 'days'}
                    </span>
                    <span className="text-2xl font-bold">
                      ₹{totalCost.total.toLocaleString()}
                    </span>
                  </div>
                  <Button className="w-full" size="lg">
                    Proceed to Booking
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* Unavailable Notice */}
        {availabilities.some((a) => !a.available) && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              Some dates are unavailable due to existing bookings or maintenance.
              Select available (green) dates to proceed.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper function to generate sample availability data
export function generateSampleAvailability(
  startDate: Date = new Date(),
  days: number = 180
): VehicleAvailability[] {
  const availabilities: VehicleAvailability[] = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < days; i++) {
    const date = new Date(currentDate)
    date.setDate(currentDate.getDate() + i)
    const dateStr = date.toISOString().split('T')[0]

    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const randomUnavail = Math.random() < 0.1 // 10% chance of being unavailable

    availabilities.push({
      date: dateStr,
      available: !randomUnavail,
      price: isWeekend ? Math.floor(Math.random() * 5000) + 8000 : Math.floor(Math.random() * 3000) + 5000,
      reason: randomUnavail ? 'Already booked' : undefined,
    })
  }

  return availabilities
}
