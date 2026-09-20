'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, MapPin, Grid3X3, List, Sparkles, Crown } from 'lucide-react'
import { VehicleCard, VehicleCardSkeleton } from '@/components/vehicle/VehicleCard'
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
import type { Vehicle } from '@/types'
import { vehicleApi } from '@/lib/api'

const ITEMS_PER_PAGE = 9

export default function VehiclesPage() {
  const searchParams = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('featured')

  useEffect(() => {
    // Load vehicles from API
    const loadVehicles = async () => {
      try {
        setLoading(true)
        const response = await vehicleApi.getVehicles()

        // Transform amenities from backend format to frontend format
        const transformAmenities = (apiAmenities: string[]) => {
          const amenityMap: Record<string, string> = {
            'AC': 'ac',
            'WIFI': 'wifi',
            'USB_CHARGING': 'charging-point',
            'TV': 'tv',
            'TOILET': 'toilet',
            'WATER_BOTTLE': 'water-bottle',
            'WATER_BOTTLES': 'water-bottle',
            'BLANKET': 'blanket',
            'BLANKETS': 'blanket',
            'PILLOWS': 'blanket',
            'MEAL': 'meal',
            'SNACKS': 'meal',
            'MUSIC_SYSTEM': 'music-system',
            'FIRST_AID_KIT': 'first-aid-kit',
            'FIRE_EXTINGUISHER': 'fire-extinguisher',
            'GPS': 'gps',
            'REAR_CAMERA': 'rear-camera',
            'PUSHBACK_SEAT': 'pushback-seat',
            'PUSHBACK_SEATS': 'pushback-seat',
            'RECLINING_SEAT': 'reclining-seat',
            'RECLINING_SEATS': 'reclining-seats',
            'READING_LIGHTS': 'reading-light',
            'READING_LIGHT': 'reading-light',
            'LUGGAGE_SPACE': 'luggage-space',
            'PASSENGER_DISPLAY': 'passenger-display',
            'ENTERTAINMENT_SYSTEM': 'entertainment-system',
            'MICROPHONE': 'microphone',
            'REFRIGERATOR': 'refrigerator',
          }
          return apiAmenities.map(a => amenityMap[a] || a.toLowerCase().replace(/_/g, '-').replace(/ /g, '-'))
        }

        // Transform API response to match Vehicle type
        const vehiclesData = response.data.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          make: v.make,
          model: v.model,
          year: v.year,
          seatingCapacity: v.seatingCapacity,
          amenities: transformAmenities(v.amenities || []),
          imageUrl: v.thumbnailImage || v.images?.[0] || '/images/placeholder-vehicle.jpg',
          images: v.images || [],
          rating: v.rating || 4.5,
          reviewCount: v.reviewCount || 0,
          basePrice: v.pricePerKm,
          priceUnit: 'per-km',
          minCharge: v.minimumCharge,
          driverCharges: v.driverAllowancePerDay,
          features: v.features?.features || [],
          description: v.description || '',
          specifications: v.specifications || {},
          available: v.isAvailable !== false,
          fuelType: v.fuelType || 'DIESEL',
          pricePerDay: v.pricePerDay,
        }))
        setVehicles(vehiclesData)
        setFilteredVehicles(vehiclesData)
      } catch (error) {
        console.error('Failed to load vehicles:', error)
        // Set empty array on error
        setVehicles([])
        setFilteredVehicles([])
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
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
  }, [searchQuery, vehicles, sortBy])

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
                        <VehicleCard
                          vehicle={vehicle}
                          variant={viewMode === 'grid' ? 'default' : 'compact'}
                          priority={currentPage === 1 && index < 6} // Priority for first page, first 6 cards
                        />
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
                        We couldn&apos;t find any vehicles matching your criteria. Try adjusting your search query.
                      </p>
                      <Button
                        className="bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
                        onClick={() => {
                          setSearchQuery('')
                        }}
                      >
                        Clear Search
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
