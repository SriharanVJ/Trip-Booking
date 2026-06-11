'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export function BusFilter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bus Type */}
        <div>
          <Label className="text-sm font-medium">Bus Type</Label>
          <div className="mt-2 space-y-2">
            {['Sleeper', 'Seater', 'Semi-Sleeper', 'AC Sleeper', 'AC Seater'].map((type) => (
              <label key={type} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <Label className="text-sm font-medium">Departure Time</Label>
          <div className="mt-2 space-y-2">
            {[
              { label: 'Before 6 AM', value: 'before-6' },
              { label: '6 AM - 12 PM', value: 'morning' },
              { label: '12 PM - 6 PM', value: 'afternoon' },
              { label: 'After 6 PM', value: 'evening' },
            ].map((time) => (
              <label key={time.value} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{time.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <Label className="text-sm font-medium">Amenities</Label>
          <div className="mt-2 space-y-2">
            {[
              { label: 'WiFi', value: 'wifi' },
              { label: 'AC', value: 'ac' },
              { label: 'Charging Point', value: 'charging' },
              { label: 'Water Bottle', value: 'water' },
            ].map((amenity) => (
              <label key={amenity.value} className="flex items-center space-x-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm">{amenity.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium">Price Range</Label>
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="100"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Rs. 0</span>
              <span>Rs. 10000+</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
