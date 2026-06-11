'use client'

import { useState, useEffect } from 'react'
import { MapPin, Calendar, Clock, Users, Route, Plus, Trash2, Car } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { cn, formatCurrency } from '@/lib/utils'
import type { TripType, Location, MultiCityStop } from '@/types/booking'
import type { Vehicle } from '@/types'

interface TripDetailsProps {
  vehicle: Vehicle
  onNext: (data: any) => void
  initialData?: any
  searchParams?: { origin?: string; destination?: string; date?: string; passengers?: string }
}

const TRIP_TYPES: { value: TripType; label: string; description: string }[] = [
  { value: 'one-way', label: 'One Way', description: 'Single trip from pickup to drop location' },
  { value: 'round-trip', label: 'Round Trip', description: 'Round trip with return journey' },
  { value: 'multi-city', label: 'Multi City', description: 'Multiple stops on your journey' }
]

const SAMPLE_LOCATIONS: Location[] = [
  { id: '1', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { id: '2', name: 'Bangalore City', city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { id: '3', name: 'Hyderabad', city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { id: '4', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { id: '5', name: 'Delhi', city: 'Delhi', state: 'Delhi', pincode: '110001' },
  { id: '6', name: 'Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001' },
  { id: '7', name: 'Pondicherry', city: 'Pondicherry', state: 'Pondicherry', pincode: '605001' },
  { id: '8', name: 'Mysore', city: 'Mysore', state: 'Karnataka', pincode: '570001' }
]

export function TripDetails({ vehicle, onNext, initialData, searchParams }: TripDetailsProps) {
  // Create pickup location from search origin
  const originCity = searchParams?.origin || initialData?.pickupLocation?.city || ''
  const destinationCity = searchParams?.destination || initialData?.dropLocation?.city || ''

  const [tripType, setTripType] = useState<TripType>(initialData?.tripType || 'one-way')

  // Create location objects from search params
  const pickupLocationFromSearch = originCity
    ? { id: 'origin', name: originCity, city: originCity, state: 'Tamil Nadu', pincode: '' }
    : null

  const [pickupLocation, setPickupLocation] = useState<Location | null>(
    initialData?.pickupLocation || pickupLocationFromSearch
  )
  const [dropLocation, setDropLocation] = useState<Location | null>(initialData?.dropLocation || null)

  // Parse date from search params (format: YYYY-MM-DD)
  const dateFromSearch = searchParams?.date
  const pickupDateFromSearch = dateFromSearch ? new Date(dateFromSearch) : undefined

  const [pickupDate, setPickupDate] = useState<Date | undefined>(
    initialData?.pickupDate ? new Date(initialData.pickupDate) : pickupDateFromSearch
  )

  // Parse passengers from search params
  const passengersFromSearch = searchParams?.passengers ? parseInt(searchParams.passengers) : undefined

  const [passengerCount, setPassengerCount] = useState<number>(
    initialData?.passengerCount || passengersFromSearch || 1
  )
  const [pickupTime, setPickupTime] = useState<string>(initialData?.pickupTime || '09:00')
  const [returnDate, setReturnDate] = useState<Date | undefined>(initialData?.returnDate ? new Date(initialData.returnDate) : undefined)
  const [returnTime, setReturnTime] = useState<string>(initialData?.returnTime || '18:00')
  const [passengerCount, setPassengerCount] = useState<number>(initialData?.passengerCount || 1)
  const [multiCityStops, setMultiCityStops] = useState<MultiCityStop[]>(initialData?.multiCityStops || [])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Calculate estimated distance and duration
  const estimateRoute = () => {
    if (!pickupLocation || !dropLocation) return null

    let totalDistance = 0
    let totalDuration = 0

    if (tripType === 'multi-city') {
      // Calculate distance through all stops
      let currentLocation = pickupLocation
      for (const stop of multiCityStops) {
        totalDistance += calculateDistance(currentLocation, stop.location)
        totalDuration += stop.duration || 120
        currentLocation = stop.location
      }
      totalDistance += calculateDistance(currentLocation, dropLocation)
      totalDuration += 240 // Base duration to final destination
    } else {
      totalDistance = calculateDistance(pickupLocation, dropLocation)
      totalDuration = Math.round(totalDistance / 50 * 60) // Assume 50 km/h average
    }

    return { distance: totalDistance, duration: totalDuration }
  }

  const calculateDistance = (from: Location, to: Location): number => {
    // Simple distance calculation (would use Google Maps API in production)
    const cityDistances: { [key: string]: { [key: string]: number } } = {
      'Chennai': { 'Bangalore': 350, 'Hyderabad': 620, 'Mumbai': 1330, 'Delhi': 2200, 'Coimbatore': 500, 'Pondicherry': 150, 'Mysore': 480 },
      'Bangalore': { 'Chennai': 350, 'Hyderabad': 570, 'Mumbai': 980, 'Delhi': 2150, 'Coimbatore': 330, 'Pondicherry': 300, 'Mysore': 150 },
      'Hyderabad': { 'Chennai': 620, 'Bangalore': 570, 'Mumbai': 710, 'Delhi': 1600, 'Coimbatore': 780, 'Pondicherry': 520, 'Mysore': 680 },
      'Mumbai': { 'Chennai': 1330, 'Bangalore': 980, 'Hyderabad': 710, 'Delhi': 1400, 'Coimbatore': 1150, 'Pondicherry': 1350, 'Mysore': 900 },
      'Delhi': { 'Chennai': 2200, 'Bangalore': 2150, 'Hyderabad': 1600, 'Mumbai': 1400, 'Coimbatore': 2450, 'Pondicherry': 2350, 'Mysore': 2200 }
    }

    return cityDistances[from.city]?.[to.city] || Math.round(Math.random() * 1000 + 200)
  }

  const estimate = estimateRoute()

  const handleValidate = () => {
    const newErrors: { [key: string]: string } = {}

    // Pickup location is pre-filled from search, no validation needed
    if (!dropLocation) newErrors.dropLocation = 'Drop location is required'
    if (!pickupDate) newErrors.pickupDate = 'Pickup date is required'
    if (!pickupTime) newErrors.pickupTime = 'Pickup time is required'

    if (tripType === 'round-trip') {
      if (!returnDate) newErrors.returnDate = 'Return date is required'
      if (!returnTime) newErrors.returnTime = 'Return time is required'
      if (returnDate && pickupDate && returnDate < pickupDate) {
        newErrors.returnDate = 'Return date must be after pickup date'
      }
    }

    if (tripType === 'multi-city' && multiCityStops.length === 0) {
      newErrors.multiCity = 'Add at least one stop for multi-city trip'
    }

    if (passengerCount < 1) newErrors.passengerCount = 'At least 1 passenger required'
    if (passengerCount > vehicle.seatingCapacity) {
      newErrors.passengerCount = `Maximum ${vehicle.seatingCapacity} passengers allowed for this vehicle`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!handleValidate()) return

    const tripData = {
      tripType,
      pickupLocation,
      dropLocation,
      pickupDate: pickupDate?.toISOString(),
      pickupTime,
      returnDate: returnDate?.toISOString(),
      returnTime,
      passengerCount,
      multiCityStops: tripType === 'multi-city' ? multiCityStops : undefined,
      estimatedDistance: estimate?.distance,
      estimatedDuration: estimate?.duration
    }

    onNext(tripData)
  }

  const addMultiCityStop = () => {
    const newStop: MultiCityStop = {
      id: `stop-${Date.now()}`,
      location: SAMPLE_LOCATIONS[0],
      duration: 120
    }
    setMultiCityStops([...multiCityStops, newStop])
  }

  const removeMultiCityStop = (id: string) => {
    setMultiCityStops(multiCityStops.filter(stop => stop.id !== id))
  }

  const updateMultiCityStopLocation = (id: string, location: Location) => {
    setMultiCityStops(multiCityStops.map(stop =>
      stop.id === id ? { ...stop, location } : stop
    ))
  }

  const updateMultiCityStopDuration = (id: string, duration: number) => {
    setMultiCityStops(multiCityStops.map(stop =>
      stop.id === id ? { ...stop, duration } : stop
    ))
  }

  const isFormValid = () => {
    return pickupLocation && dropLocation && pickupDate && pickupTime &&
           (tripType !== 'round-trip' || (returnDate && returnTime)) &&
           (tripType !== 'multi-city' || multiCityStops.length > 0) &&
           passengerCount > 0 && passengerCount <= vehicle.seatingCapacity
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Summary */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
              <img src={vehicle.imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{vehicle.type}</Badge>
                <span className="text-xs text-muted-foreground">{vehicle.seatingCapacity} seats</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Starting from</p>
              <p className="text-lg font-semibold">{formatCurrency(vehicle.basePrice)}</p>
              <p className="text-xs text-muted-foreground">per km</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Trip Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tripType} onValueChange={(value) => setTripType(value as TripType)}>
            <div className="space-y-3">
              {TRIP_TYPES.map((type) => (
                <div key={type.value} className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={type.value} id={`trip-${type.value}`} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={`trip-${type.value}`} className="cursor-pointer font-medium">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pickup Location - Read-only from search */}
          {pickupLocation && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Location
              </Label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium">{pickupLocation.name}</span>
                <Badge variant="secondary" className="ml-auto">From Search</Badge>
              </div>
            </div>
          )}

          {/* Drop Location */}
          <div className="space-y-2">
            <Label htmlFor="drop" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Drop Location <span className="text-destructive">*</span>
            </Label>
            <Select
              value={dropLocation?.id}
              onValueChange={(value) => {
                const location = SAMPLE_LOCATIONS.find(l => l.id === value)
                setDropLocation(location || null)
                delete errors.dropLocation
              }}
            >
              <SelectTrigger className={cn(errors.dropLocation && 'border-destructive')}>
                <SelectValue placeholder="Select drop location" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_LOCATIONS.filter(l => l.id !== pickupLocation?.id).map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}, {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dropLocation && <p className="text-sm text-destructive">{errors.dropLocation}</p>}
          </div>

          {/* Drop Location */}
          <div className="space-y-2">
            <Label htmlFor="drop" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Drop Location <span className="text-destructive">*</span>
            </Label>
            <Select
              value={dropLocation?.id}
              onValueChange={(value) => {
                const location = SAMPLE_LOCATIONS.find(l => l.id === value)
                setDropLocation(location || null)
                delete errors.dropLocation
              }}
            >
              <SelectTrigger className={cn(errors.dropLocation && 'border-destructive')}>
                <SelectValue placeholder="Select drop location" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_LOCATIONS.filter(l => l.id !== pickupLocation?.id).map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}, {location.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.dropLocation && <p className="text-sm text-destructive">{errors.dropLocation}</p>}
          </div>

          {/* Multi-City Stops */}
          {tripType === 'multi-city' && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Intermediate Stops <span className="text-destructive">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addMultiCityStop}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Stop
                </Button>
              </div>

              {multiCityStops.length === 0 && (
                <p className="text-sm text-muted-foreground">No stops added yet. Add at least one stop.</p>
              )}

              {multiCityStops.map((stop, index) => (
                <div key={stop.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Select
                      value={stop.location.id}
                      onValueChange={(value) => {
                        const location = SAMPLE_LOCATIONS.find(l => l.id === value)
                        if (location) updateMultiCityStopLocation(stop.id, location)
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stop location" />
                      </SelectTrigger>
                      <SelectContent>
                        {SAMPLE_LOCATIONS
                          .filter(l => l.id !== pickupLocation?.id && l.id !== dropLocation?.id)
                          .map((location) => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name}, {location.city}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`duration-${stop.id}`} className="text-sm">Duration (min):</Label>
                      <Input
                        id={`duration-${stop.id}`}
                        type="number"
                        min="15"
                        step="15"
                        value={stop.duration}
                        onChange={(e) => updateMultiCityStopDuration(stop.id, parseInt(e.target.value) || 120)}
                        className="w-24"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMultiCityStop(stop.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {errors.multiCity && <p className="text-sm text-destructive">{errors.multiCity}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date and Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pickup Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pickup Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !pickupDate && 'text-muted-foreground',
                      errors.pickupDate && 'border-destructive'
                    )}
                  >
                    {pickupDate ? pickupDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={pickupDate}
                    onSelect={(date) => {
                      setPickupDate(date)
                      delete errors.pickupDate
                    }}
                    fromDate={new Date()}
                  />
                </PopoverContent>
              </Popover>
              {errors.pickupDate && <p className="text-sm text-destructive">{errors.pickupDate}</p>}
            </div>

            {/* Pickup Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pickup Time <span className="text-destructive">*</span>
              </Label>
              <Input
                type="time"
                value={pickupTime}
                onChange={(e) => {
                  setPickupTime(e.target.value)
                  delete errors.pickupTime
                }}
                className={cn(errors.pickupTime && 'border-destructive')}
              />
              {errors.pickupTime && <p className="text-sm text-destructive">{errors.pickupTime}</p>}
            </div>
          </div>

          {/* Return Date & Time for Round Trip */}
          {tripType === 'round-trip' && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Return Date <span className="text-destructive">*</span>
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !returnDate && 'text-muted-foreground',
                          errors.returnDate && 'border-destructive'
                        )}
                      >
                        {returnDate ? returnDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }) : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={returnDate}
                        onSelect={(date) => {
                          setReturnDate(date)
                          delete errors.returnDate
                        }}
                        fromDate={pickupDate || new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.returnDate && <p className="text-sm text-destructive">{errors.returnDate}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Return Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="time"
                    value={returnTime}
                    onChange={(e) => {
                      setReturnTime(e.target.value)
                      delete errors.returnTime
                    }}
                    className={cn(errors.returnTime && 'border-destructive')}
                  />
                  {errors.returnTime && <p className="text-sm text-destructive">{errors.returnTime}</p>}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Passenger Count */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Passengers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Number of Passengers</p>
                  <p className="text-sm text-muted-foreground">
                    Maximum {vehicle.seatingCapacity} passengers allowed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                  disabled={passengerCount <= 1}
                >
                  -
                </Button>
                <span className="w-12 text-center font-semibold">{passengerCount}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPassengerCount(Math.min(vehicle.seatingCapacity, passengerCount + 1))}
                  disabled={passengerCount >= vehicle.seatingCapacity}
                >
                  +
                </Button>
              </div>
            </div>
            {errors.passengerCount && <p className="text-sm text-destructive">{errors.passengerCount}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Route Estimate */}
      {estimate && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Car className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">Estimated Journey</p>
                  <p className="text-sm text-muted-foreground">
                    Approximate distance and duration
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{estimate.distance} km</p>
                <p className="text-sm text-muted-foreground">
                  {Math.floor(estimate.duration / 60)}h {estimate.duration % 60}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full"
        onClick={handleNext}
        disabled={!isFormValid()}
      >
        Continue to Customer Details
      </Button>
    </div>
  )
}
