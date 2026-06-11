'use client'

import { useState } from 'react'
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Sparkles,
  Crown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import type { VehicleFilterParams, VehicleType, VehicleAmenity } from '@/types'

interface VehicleFilterProps {
  onFilterChange: (filters: VehicleFilterParams) => void
  initialFilters?: VehicleFilterParams
  isOpen?: boolean
  onToggle?: () => void
}

const seatingCapacities = [5, 7, 9, 14, 21, 24, 52] as const

const vehicleTypes: { value: VehicleType; label: string; icon: string; color: string }[] = [
  { value: 'car', label: 'Sedan', icon: '🚗', color: 'text-gold' },
  { value: 'traveller', label: 'Traveller', icon: '🚌', color: 'text-emerald-400' },
  { value: 'coach', label: 'Coach', icon: '🚐', color: 'text-purple-400' },
  { value: 'bus', label: 'Luxury Bus', icon: '🚌', color: 'text-blue-400' },
]

const amenities: { value: VehicleAmenity; label: string; icon: string }[] = [
  { value: 'ac', label: 'Air Conditioning', icon: '❄️' },
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'charging-point', label: 'Charging Points', icon: '🔌' },
  { value: 'tv', label: 'TV/Entertainment', icon: '📺' },
  { value: 'toilet', label: 'Toilet', icon: '🚻' },
  { value: 'water-bottle', label: 'Water Bottles', icon: '💧' },
  { value: 'meal', label: 'Meals', icon: '🍽️' },
  { value: 'music-system', label: 'Music System', icon: '🎵' },
  { value: 'gps', label: 'GPS Navigation', icon: '📍' },
  { value: 'pushback-seat', label: 'Pushback Seats', icon: '💺' },
]

export function VehicleFilter({
  onFilterChange,
  initialFilters = {},
  isOpen: isMobileOpen = false,
  onToggle,
}: VehicleFilterProps) {
  const [filters, setFilters] = useState<VehicleFilterParams>(initialFilters)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    vehicleType: true,
    seating: true,
    amenities: false,
    priceRange: false,
  })
  const [priceRange, setPriceRange] = useState<number[]>([
    filters.priceMin || 0,
    filters.priceMax || 100,
  ])

  const handleSeatingChange = (
    capacity: number,
    checked: boolean | 'indeterminate'
  ) => {
    const currentSeating = filters.seatingCapacity || []
    const newSeating = checked
      ? [...currentSeating, capacity]
      : currentSeating.filter((c) => c !== capacity)

    const updatedFilters = { ...filters, seatingCapacity: newSeating }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handleVehicleTypeChange = (
    type: VehicleType,
    checked: boolean | 'indeterminate'
  ) => {
    const currentTypes = filters.vehicleTypes || []
    const newTypes = checked
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type)

    const updatedFilters = { ...filters, vehicleTypes: newTypes }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handleAmenityChange = (
    amenity: VehicleAmenity,
    checked: boolean | 'indeterminate'
  ) => {
    const currentAmenities = filters.amenities || []
    const newAmenities = checked
      ? [...currentAmenities, amenity]
      : currentAmenities.filter((a) => a !== amenity)

    const updatedFilters = { ...filters, amenities: newAmenities }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    const updatedFilters = {
      ...filters,
      priceMin: values[0] > 0 ? values[0] : undefined,
      priceMax: values[1] < 100 ? values[1] : undefined,
    }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)
  }

  const handleClearFilters = () => {
    const clearedFilters: VehicleFilterParams = {}
    setFilters(clearedFilters)
    setPriceRange([0, 100])
    onFilterChange(clearedFilters)
  }

  const activeFilterCount =
    (filters.seatingCapacity?.length || 0) +
    (filters.vehicleTypes?.length || 0) +
    (filters.amenities?.length || 0) +
    ((filters.priceMin !== undefined || filters.priceMax !== undefined) ? 1 : 0)

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const FilterSection = ({
    title,
    icon,
    isOpen,
    onToggle,
    children,
    goldAccent = false,
  }: {
    title: string
    icon?: React.ReactNode
    isOpen: boolean
    onToggle: () => void
    children: React.ReactNode
    goldAccent?: boolean
  }) => (
    <div className="border-b border-gold/10 py-5 last:border-0">
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full text-left font-display font-semibold text-lg tracking-wide transition-colors ${
          goldAccent ? 'text-gold hover:text-gold-light' : 'text-warm-white hover:text-gold'
        }`}
      >
        <div className="flex items-center gap-2">
          {icon}
          {title}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gold/60" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gold/60" />
        )}
      </button>
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleContent className="mt-4 space-y-3">
          {children}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )

  return (
    <>
      {/* Mobile Header */}
      {!isMobileOpen && (
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-gold" />
            <h2 className="text-lg font-display font-semibold text-warm-white">Filters</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gold hover:text-gold-light"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Luxury Filter Card */}
      <div className="glass-luxury-card rounded-3xl overflow-hidden border-gold/20 shadow-luxury-lg">
        {/* Header */}
        <div className="p-6 border-b border-gold/10 bg-gradient-to-r from-gold/5 to-transparent">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gold/10 border border-gold/30">
                <SlidersHorizontal className="h-5 w-5 text-gold" />
              </div>
              <h2 className="text-xl font-display font-bold text-warm-white">
                Refine Selection
              </h2>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-3">
              <Badge className="bg-gold/20 text-gold border border-gold/30 font-medium">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gold hover:text-gold-light hover:bg-gold/10 h-8 text-sm font-medium"
              >
                Clear all
                <X className="ml-1 h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="p-6 space-y-1">
          {/* Vehicle Type Filter */}
          <FilterSection
            title="Vehicle Type"
            icon={<Crown className="h-5 w-5" />}
            isOpen={openSections.vehicleType}
            onToggle={() => toggleSection('vehicleType')}
            goldAccent
          >
            <div className="space-y-3">
              {vehicleTypes.map((type) => (
                <div
                  key={type.value}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    filters.vehicleTypes?.includes(type.value)
                      ? 'bg-gold/10 border border-gold/30 shadow-gold'
                      : 'hover:bg-gold/5 border border-transparent hover:border-gold/10'
                  }`}
                >
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.vehicleTypes?.includes(type.value)}
                    onCheckedChange={(checked) =>
                      handleVehicleTypeChange(type.value, checked)
                    }
                    className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="text-sm cursor-pointer flex-1 flex items-center gap-3 font-medium text-warm-white group-hover:text-gold transition-colors"
                  >
                    <span className="text-xl">{type.icon}</span>
                    <span className={filters.vehicleTypes?.includes(type.value) ? 'text-gold' : ''}>
                      {type.label}
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Seating Capacity Filter */}
          <FilterSection
            title="Seating Capacity"
            icon={<Users className="h-5 w-5" />}
            isOpen={openSections.seating}
            onToggle={() => toggleSection('seating')}
          >
            <div className="space-y-3">
              {seatingCapacities.map((capacity) => (
                <div
                  key={capacity}
                  className={`group flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    filters.seatingCapacity?.includes(capacity)
                      ? 'bg-gold/10 border border-gold/30 shadow-gold'
                      : 'hover:bg-gold/5 border border-transparent hover:border-gold/10'
                  }`}
                >
                  <Checkbox
                    id={`seats-${capacity}`}
                    checked={filters.seatingCapacity?.includes(capacity)}
                    onCheckedChange={(checked) =>
                      handleSeatingChange(capacity, checked)
                    }
                    className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                  />
                  <Label
                    htmlFor={`seats-${capacity}`}
                    className={`text-sm cursor-pointer flex-1 font-medium ${
                      filters.seatingCapacity?.includes(capacity)
                        ? 'text-gold font-semibold'
                        : 'text-warm-white group-hover:text-gold transition-colors'
                    }`}
                  >
                    {capacity} Seater
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Price Range Filter */}
          <FilterSection
            title="Price Range"
            icon={<Sparkles className="h-5 w-5" />}
            isOpen={openSections.priceRange}
            onToggle={() => toggleSection('priceRange')}
          >
            <div className="space-y-6">
              <div className="px-2">
                <Slider
                  value={priceRange}
                  onValueChange={handlePriceRangeChange}
                  max={100}
                  step={5}
                  className="my-4"
                />
                <div className="flex items-center justify-between text-sm font-medium text-warm-white-dark/60">
                  <span>Rs. {priceRange[0] * 10}/km</span>
                  <span>Rs. {priceRange[1] * 10}/km</span>
                </div>
              </div>
            </div>
          </FilterSection>

          {/* Amenities Filter */}
          <FilterSection
            title="Premium Amenities"
            icon={<Star className="h-5 w-5" />}
            isOpen={openSections.amenities}
            onToggle={() => toggleSection('amenities')}
          >
            <div className="grid grid-cols-2 gap-3">
              {amenities.map((amenity) => (
                <div
                  key={amenity.value}
                  className={`group flex items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                    filters.amenities?.includes(amenity.value)
                      ? 'bg-gold/10 border border-gold/30 shadow-gold'
                      : 'hover:bg-gold/5 border border-transparent hover:border-gold/10'
                  }`}
                >
                  <Checkbox
                    id={`amenity-${amenity.value}`}
                    checked={filters.amenities?.includes(amenity.value)}
                    onCheckedChange={(checked) =>
                      handleAmenityChange(amenity.value, checked)
                    }
                    className="border-gold/30 data-[state=checked]:bg-gold data-[state=checked]:border-gold flex-shrink-0"
                  />
                  <Label
                    htmlFor={`amenity-${amenity.value}`}
                    className={`text-xs cursor-pointer flex items-center gap-1.5 font-medium leading-tight ${
                      filters.amenities?.includes(amenity.value)
                        ? 'text-gold font-semibold'
                        : 'text-warm-white group-hover:text-gold transition-colors'
                    }`}
                  >
                    <span>{amenity.icon}</span>
                    <span className="truncate">{amenity.label}</span>
                  </Label>
                </div>
              ))}
            </div>
          </FilterSection>
        </div>
      </div>

      {/* Filter Stats - Desktop Only */}
      <div className="hidden lg:block mt-6 glass-luxury-card rounded-2xl p-5 border-gold/10">
        <div className="text-center">
          <p className="text-xs text-warm-white-dark/60 mb-2 tracking-wide uppercase">Premium Fleet</p>
          <div className="text-3xl font-display font-bold text-gradient-gold mb-1">
            {activeFilterCount > 0 ? filteredVehicles.length : '500+'}
          </div>
          <p className="text-sm text-warm-white-dark/60">vehicles available</p>
        </div>
      </div>
    </>
  )
}

import { Users, Star } from 'lucide-react'

// This would be passed as a prop or imported from a parent component in a real implementation
const filteredVehicles = { length: 48 }
