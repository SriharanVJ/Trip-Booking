'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, SlidersHorizontal, Grid3X3, List, Sparkles, Crown, Filter, ChevronDown } from 'lucide-react'
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicle/VehicleCard'
import { VehicleFilter } from '@/components/vehicle/VehicleFilter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Vehicle, VehicleFilterParams } from '@/types'

// Sample data - in real app, this would come from API
const sampleVehicles: Vehicle[] = [
  {
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
    ],
    rating: 4.8,
    reviewCount: 124,
    basePrice: 18,
    priceUnit: 'per-km',
    minCharge: 250,
    driverCharges: 500,
    features: [
      'Premium leather seats',
      'Spacious luggage compartment',
      'Professional and experienced driver',
      '24/7 customer support',
      'GPS tracking enabled',
    ],
    description:
      'Experience luxury travel with the Toyota Innova Crysta. Perfect for family trips and business travel with premium comfort and safety features.',
    specifications: {
      engine: '2.8L Diesel',
      fuelType: 'diesel',
      transmission: 'automatic',
      mileage: '11.4 kmpl',
      luggageCapacity: '343L',
    },
    available: true,
  },
  {
    id: 'v2',
    name: 'Force Traveller 3350',
    type: 'traveller',
    make: 'Force',
    model: 'Traveller 3350',
    year: 2022,
    seatingCapacity: 14,
    amenities: ['ac', 'charging-point', 'pushback-seat', 'music-system'],
    imageUrl: '/images/vehicles/traveller.jpg',
    images: [
      '/images/vehicles/traveller.jpg',
      '/images/vehicles/traveller-2.jpg',
    ],
    rating: 4.5,
    reviewCount: 89,
    basePrice: 24,
    priceUnit: 'per-km',
    minCharge: 300,
    driverCharges: 600,
    features: [
      'Pushback seats for comfort',
      'Ample legroom',
      'First aid kit included',
      'Fire safety equipment',
      'Experienced driver',
    ],
    description:
      'Ideal for group travel, the Force Traveller offers comfortable seating for up to 14 passengers with AC and modern amenities.',
    specifications: {
      engine: '2.6L Diesel',
      fuelType: 'diesel',
      transmission: 'manual',
      mileage: '9 kmpl',
      luggageCapacity: '500L',
    },
    available: true,
  },
  {
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
    ],
    imageUrl: '/images/vehicles/volvo-coach.jpg',
    images: [
      '/images/vehicles/volvo-coach.jpg',
      '/images/vehicles/volvo-coach-2.jpg',
      '/images/vehicles/volvo-coach-3.jpg',
    ],
    rating: 4.9,
    reviewCount: 256,
    basePrice: 35,
    priceUnit: 'per-km',
    minCharge: 500,
    driverCharges: 800,
    features: [
      'Luxury recliner seats',
      'Individual entertainment screens',
      'Onboard restrooms',
      'Complimentary meals',
      'WiFi connectivity',
      'USB charging at every seat',
    ],
    description:
      'Travel in luxury with the Volvo 9400XL. Features premium amenities including WiFi, entertainment systems, and onboard restrooms for long-distance comfort.',
    specifications: {
      engine: '11L Diesel',
      fuelType: 'diesel',
      transmission: 'automatic',
      mileage: '4.5 kmpl',
      length: '12m',
      width: '2.6m',
      height: '3.8m',
      luggageCapacity: '2000L',
    },
    available: true,
  },
  {
    id: 'v4',
    name: 'Mercedes Benz Sprinter',
    type: 'traveller',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2023,
    seatingCapacity: 9,
    amenities: ['ac', 'wifi', 'charging-point', 'gps', 'rear-camera'],
    imageUrl: '/images/vehicles/sprinter.jpg',
    images: ['/images/vehicles/sprinter.jpg'],
    rating: 4.7,
    reviewCount: 67,
    basePrice: 28,
    priceUnit: 'per-km',
    minCharge: 350,
    driverCharges: 600,
    features: [
      'Premium interior finish',
      'Advanced safety features',
      'Climate control',
      'Spacious interior',
    ],
    description:
      'The Mercedes-Benz Sprinter combines luxury with functionality. Perfect for corporate travel and small groups.',
    specifications: {
      engine: '2.1L Diesel',
      fuelType: 'diesel',
      transmission: 'automatic',
      mileage: '12 kmpl',
      luggageCapacity: '400L',
    },
    available: true,
  },
  {
    id: 'v5',
    name: 'AC Seater Bus 52',
    type: 'bus',
    make: 'Tata',
    model: 'AC Seater',
    year: 2022,
    seatingCapacity: 52,
    amenities: ['ac', 'charging-point', 'pushback-seat'],
    imageUrl: '/images/vehicles/ac-bus.jpg',
    images: ['/images/vehicles/ac-bus.jpg'],
    rating: 4.3,
    reviewCount: 142,
    basePrice: 42,
    priceUnit: 'per-km',
    minCharge: 800,
    driverCharges: 1000,
    features: [
      'Large group capacity',
      'Comfortable pushback seats',
      'Individual AC vents',
      'Ample luggage space',
    ],
    description:
      'Perfect for large groups and tours. This 52-seater AC bus offers comfort and reliability for group travel.',
    specifications: {
      engine: '6L Diesel',
      fuelType: 'diesel',
      transmission: 'manual',
      mileage: '5 kmpl',
      length: '12m',
      width: '2.4m',
      height: '3.5m',
      luggageCapacity: '3000L',
    },
    available: true,
  },
  {
    id: 'v6',
    name: 'Tempo Traveller 26',
    type: 'traveller',
    make: 'Force',
    model: 'Tempo Traveller',
    year: 2021,
    seatingCapacity: 26,
    amenities: ['ac', 'charging-point', 'pushback-seat', 'music-system'],
    imageUrl: '/images/vehicles/tempo.jpg',
    images: ['/images/vehicles/tempo.jpg'],
    rating: 4.4,
    reviewCount: 98,
    basePrice: 26,
    priceUnit: 'per-km',
    minCharge: 400,
    driverCharges: 700,
    features: [
      'Pushback seats',
      'Music system',
      'First aid kit',
      'Fire extinguisher',
    ],
    description:
      'Economical group travel solution. The Tempo Traveller 26 seater is perfect for medium-sized groups.',
    specifications: {
      engine: '2.6L Diesel',
      fuelType: 'diesel',
      transmission: 'manual',
      mileage: '8 kmpl',
      luggageCapacity: '800L',
    },
    available: true,
  },
]

const ITEMS_PER_PAGE = 9

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<VehicleFilterParams>({})
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setVehicles(sampleVehicles)
      setFilteredVehicles(sampleVehicles)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let result = [...vehicles]

    // Apply search query
    if (searchQuery) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          v.model.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    if (filters.seatingCapacity && filters.seatingCapacity.length > 0) {
      result = result.filter((v) =>
        filters.seatingCapacity!.includes(v.seatingCapacity)
      )
    }

    if (filters.vehicleTypes && filters.vehicleTypes.length > 0) {
      result = result.filter((v) => filters.vehicleTypes!.includes(v.type))
    }

    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      result = result.filter((v) => {
        if (filters.priceMin && v.basePrice < filters.priceMin) return false
        if (filters.priceMax && v.basePrice > filters.priceMax) return false
        return true
      })
    }

    if (filters.amenities && filters.amenities.length > 0) {
      result = result.filter((v) =>
        filters.amenities!.every((a) => v.amenities.includes(a))
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.basePrice - b.basePrice)
        break
      case 'price-high':
        result.sort((a, b) => b.basePrice - a.basePrice)
        break
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'featured':
      default:
        // Keep original order or featured sorting
        break
    }

    setFilteredVehicles(result)
    setCurrentPage(1)
  }, [filters, searchQuery, vehicles, sortBy])

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex)

  const handleFilterChange = (newFilters: VehicleFilterParams) => {
    setFilters(newFilters)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeFilterCount =
    (filters.seatingCapacity?.length || 0) +
    (filters.vehicleTypes?.length || 0) +
    (filters.amenities?.length || 0) +
    (filters.location ? 1 : 0) +
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0)

  return (
    <div className="min-h-screen bg-black">
      {/* Luxury Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32 border-b border-gold/20">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-charcoal-dark to-black">
          <div className="absolute inset-0 bg-gradient-luxury-mesh"></div>
          <div className="absolute inset-0 pattern-luxury-grid opacity-20"></div>
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-float-luxury"></div>
          <div className="absolute bottom-20 right-10 w-[30rem] h-[30rem] bg-gold/8 rounded-full blur-3xl animate-float-luxury" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="flex justify-center mb-8 animate-fade-in-luxury">
              <Badge className="glass-luxury px-5 py-2 text-sm font-medium border-gold text-gold shadow-gold-lg">
                <Crown className="w-4 h-4 mr-2 animate-gold-pulse" />
                Premium Fleet Collection
              </Badge>
            </div>

            {/* Heading */}
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gradient-gold animate-fade-in-up-luxury">
              Discover Your Perfect Journey
            </h1>

            <p className="text-xl text-warm-white-dark/70 mb-12 max-w-2xl mx-auto font-light leading-relaxed animate-fade-in-up-luxury" style={{ animationDelay: '0.1s' }}>
              Browse our exclusive collection of premium vehicles, meticulously curated for the most discerning travelers
            </p>

            {/* Luxury Search Bar */}
            <div className="max-w-2xl mx-auto animate-scale-in-luxury" style={{ animationDelay: '0.2s' }}>
              <div className="glass-luxury-card rounded-2xl p-2 shadow-luxury-lg border-gold-thick">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/70" />
                  <Input
                    placeholder="Search by vehicle name, make, or model..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-14 pr-4 h-14 bg-transparent border-0 text-warm-white placeholder:text-warm-white-dark/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-warm-white-dark/60 animate-fade-in-up-luxury" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-gold-pulse"></div>
                <span className="text-sm">All Vehicles Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-gold-pulse" style={{ animationDelay: '0.5s' }}></div>
                <span className="text-sm">Premium Insurance Included</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gold animate-gold-pulse" style={{ animationDelay: '1s' }}></div>
                <span className="text-sm">24/7 Concierge Support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0 animate-fade-in-up-luxury">
            <VehicleFilter
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
          </div>

          {/* Mobile Filter Sheet */}
          <div className="lg:hidden fixed bottom-6 right-6 z-50">
            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  size="lg"
                  className="h-16 w-16 rounded-full bg-gradient-to-r from-gold to-gold-light text-black shadow-gold-lg shimmer-gold hover:shadow-gold-xl transition-all"
                >
                  <Filter className="h-6 w-6" />
                  {activeFilterCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-black text-gold border border-gold flex items-center justify-center p-0">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-80 bg-black border-gold/20">
                <SheetHeader>
                  <SheetTitle className="text-gold font-display text-2xl">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-8">
                  <VehicleFilter
                    onFilterChange={handleFilterChange}
                    initialFilters={filters}
                    isOpen={filterOpen}
                    onToggle={() => setFilterOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Results Section */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in-up-luxury" style={{ animationDelay: '0.1s' }}>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  <h2 className="text-2xl md:text-3xl font-display font-bold text-warm-white">
                    Premium Collection
                  </h2>
                </div>
                <p className="text-warm-white-dark/60">
                  {filteredVehicles.length} distinguished vehicle{filteredVehicles.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {/* Sort & View Controls */}
              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[140px] bg-charcoal-dark/50 border-gold/20 text-warm-white hover:border-gold/40 transition-colors">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-charcoal-dark border-gold/20">
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Top Rated</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex items-center bg-charcoal-dark/50 rounded-lg border border-gold/20 overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 transition-colors ${
                      viewMode === 'grid' ? 'bg-gold/20 text-gold' : 'text-warm-white-dark/40 hover:text-warm-white'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 transition-colors ${
                      viewMode === 'list' ? 'bg-gold/20 text-gold' : 'text-warm-white-dark/40 hover:text-warm-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-3 mb-8 animate-fade-in-up-luxury" style={{ animationDelay: '0.15s' }}>
                <span className="text-sm text-warm-white-dark/60">Active filters:</span>
                <Badge className="bg-gold/20 text-gold border border-gold/30">
                  {activeFilterCount} applied
                </Badge>
                <button
                  onClick={() => {
                    setFilters({})
                    setSearchQuery('')
                  }}
                  className="text-sm text-gold hover:text-gold-light transition-colors flex items-center gap-1"
                >
                  Clear all
                  <ChevronDown className="h-3 w-3 rotate-180" />
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <VehicleCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                {/* Vehicle Grid */}
                {paginatedVehicles.length > 0 ? (
                  <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                    {paginatedVehicles.map((vehicle, index) => (
                      <div
                        key={vehicle.id}
                        className="animate-fade-in-up-luxury"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <VehicleCard vehicle={vehicle} variant={viewMode === 'grid' ? 'default' : 'compact'} />
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Empty State */
                  <div className="text-center py-24 animate-fade-in-up-luxury">
                    <div className="glass-luxury-card rounded-3xl p-12 max-w-lg mx-auto border-gold/20">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/10 border border-gold/30 mb-6">
                        <Search className="h-10 w-10 text-gold" />
                      </div>
                      <h3 className="font-display text-2xl font-bold text-warm-white mb-4">
                        No vehicles found
                      </h3>
                      <p className="text-warm-white-dark/60 mb-8 leading-relaxed">
                        We couldn't find any vehicles matching your criteria. Try adjusting your filters or search query.
                      </p>
                      <Button
                        className="bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
                        onClick={() => {
                          setFilters({})
                          setSearchQuery('')
                        }}
                      >
                        Clear All Filters
                      </Button>
                    </div>
                  </div>
                )}

                {/* Luxury Pagination */}
                {totalPages > 1 && paginatedVehicles.length > 0 && (
                  <div className="mt-16 animate-fade-in-up-luxury" style={{ animationDelay: '0.2s' }}>
                    <div className="glass-luxury-card rounded-2xl p-2 border-gold/20 inline-flex mx-auto">
                      <Pagination>
                        <PaginationContent className="gap-1">
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                currentPage > 1 && handlePageChange(currentPage - 1)
                              }
                              className={`rounded-xl ${
                                currentPage === 1
                                  ? 'pointer-events-none opacity-50'
                                  : 'hover:bg-gold/10 text-warm-white hover:text-gold cursor-pointer'
                              }`}
                            />
                          </PaginationItem>

                          {Array.from({ length: totalPages }).map((_, index) => {
                            const page = index + 1
                            const showFirst = page === 1
                            const showLast = page === totalPages
                            const showEllipsisStart = page === 2 && currentPage > 4
                            const showEllipsisEnd = page === totalPages - 1 && currentPage < totalPages - 3

                            if (showFirst || showLast || page === currentPage) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(page)}
                                    isActive={page === currentPage}
                                    className={`rounded-xl min-w-[44px] ${
                                      page === currentPage
                                        ? 'bg-gradient-to-r from-gold to-gold-light text-black font-semibold shadow-gold-lg'
                                        : 'hover:bg-gold/10 text-warm-white hover:text-gold cursor-pointer'
                                    }`}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            }

                            if (showEllipsisStart || showEllipsisEnd) {
                              return (
                                <PaginationEllipsis key={`ellipsis-${page}`} className="text-warm-white-dark/40" />
                              )
                            }

                            if (
                              page === currentPage - 1 ||
                              page === currentPage + 1
                            ) {
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    onClick={() => handlePageChange(page)}
                                    isActive={false}
                                    className="rounded-xl hover:bg-gold/10 text-warm-white hover:text-gold cursor-pointer min-w-[44px]"
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            }

                            return null
                          })}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                currentPage < totalPages &&
                                handlePageChange(currentPage + 1)
                              }
                              className={`rounded-xl ${
                                currentPage === totalPages
                                  ? 'pointer-events-none opacity-50'
                                  : 'hover:bg-gold/10 text-warm-white hover:text-gold cursor-pointer'
                              }`}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Premium CTA Section */}
      <section className="relative py-24 border-t border-gold/20">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-charcoal-dark to-black">
          <div className="absolute inset-0 bg-gradient-luxury-mesh"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <Badge className="mb-6 glass-luxury border-gold text-gold">
              <Crown className="w-4 h-4 mr-1" />
              Concierge Service
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-6">
              Need Assistance Selecting Your Vehicle?
            </h2>
            <p className="text-xl text-warm-white-dark/70 mb-10 font-light leading-relaxed">
              Our dedicated travel consultants are available 24/7 to help you find the perfect vehicle for your journey
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Button
                size="lg"
                className="h-14 px-8 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
              >
                Speak with a Consultant
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 bg-transparent text-gold border-2 border-gold/40 hover:bg-gold/10 hover:border-gold/60 font-display font-semibold rounded-xl backdrop-blur transition-all"
              >
                View All Amenities
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
