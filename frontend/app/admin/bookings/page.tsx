'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, Phone, MapPin, Bus, TrendingUp, Search, Filter } from 'lucide-react'
import { bookingApi, vehicleApi } from '@/lib/api'

interface Booking {
  id: string
  bookingNumber: string
  status: string
  totalAmount: number
  startDate: string
  endDate?: string
  contactName: string
  contactPhone: string
  contactEmail?: string
  vehicleId: string
  vehicle?: {
    id: string
    name: string
    type: string
  }
  pickupLocation?: {
    address: string
    city?: string
  }
  dropLocation?: {
    address: string
    city?: string
  }
  createdAt: string
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await bookingApi.getBookings()
        const bookingsData = response.data

        // Fetch vehicle details for each booking
        const bookingsWithVehicles = await Promise.all(
          bookingsData.map(async (booking: any) => {
            try {
              const vehicleResponse = await vehicleApi.getVehicle(booking.vehicleId)
              return {
                ...booking,
                vehicle: {
                  id: vehicleResponse.data.id,
                  name: vehicleResponse.data.name,
                  type: vehicleResponse.data.type,
                }
              }
            } catch {
              return booking
            }
          })
        )

        setBookings(bookingsWithVehicles)
        setFilteredBookings(bookingsWithVehicles)
      } catch (err: any) {
        console.error('Failed to load bookings:', err)
        setError('Failed to load bookings. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  // Filter bookings by status and search query
  useEffect(() => {
    let filtered = bookings

    if (statusFilter !== 'all') {
      filtered = filtered.filter((b) => b.status.toLowerCase() === statusFilter.toLowerCase())
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (b) =>
          b.bookingNumber.toLowerCase().includes(query) ||
          b.contactName?.toLowerCase().includes(query) ||
          b.contactPhone?.includes(query) ||
          b.vehicle?.name?.toLowerCase().includes(query)
      )
    }

    setFilteredBookings(filtered)
  }, [bookings, statusFilter, searchQuery])

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase()
    switch (s) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'completed':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'cancelled':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status.toLowerCase() === 'confirmed').length,
    pending: bookings.filter((b) => b.status.toLowerCase() === 'pending').length,
    completed: bookings.filter((b) => b.status.toLowerCase() === 'completed').length,
    cancelled: bookings.filter((b) => b.status.toLowerCase() === 'cancelled').length,
    revenue: bookings
      .filter((b) => ['confirmed', 'completed'].includes(b.status.toLowerCase()))
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-gold/5 border-b border-gold/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="ghost" size="icon" className="hover:bg-gold/10">
                  <ArrowLeft className="h-5 w-5 text-gold" />
                </Button>
              </Link>
              <div>
                <h1 className="font-display text-3xl font-bold text-warm-white">Bookings</h1>
                <p className="text-warm-white-dark/60">Manage all bookings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="glass-luxury-card border-gold/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warm-white">{stats.total}</div>
              <div className="text-xs text-warm-white-dark/60">Total</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.confirmed}</div>
              <div className="text-xs text-warm-white-dark/60">Confirmed</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-amber-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-amber-400">{stats.pending}</div>
              <div className="text-xs text-warm-white-dark/60">Pending</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-blue-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.completed}</div>
              <div className="text-xs text-warm-white-dark/60">Completed</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-red-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.cancelled}</div>
              <div className="text-xs text-warm-white-dark/60">Cancelled</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-purple-400">₹{(stats.revenue / 1000).toFixed(0)}k</div>
              <div className="text-xs text-warm-white-dark/60">Revenue</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-luxury-card border-gold/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-gold/70" />
                <input
                  type="text"
                  placeholder="Search by booking number, name, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-gold/20 rounded-lg px-3 py-2 text-sm text-warm-white placeholder:text-warm-white-dark/40 focus:outline-none focus:border-gold/50 w-full md:w-80"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gold/70" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-black/50 border border-gold/20 rounded-lg px-3 py-2 text-sm text-warm-white focus:outline-none focus:border-gold/50"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
              <p className="text-warm-white-dark/60">Loading bookings...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="glass-luxury-card border-red-500/20">
            <CardContent className="p-8 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="bg-gold text-black hover:bg-gold/90"
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : filteredBookings.length === 0 ? (
          <Card className="glass-luxury-card border-gold/20">
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 text-gold/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-warm-white mb-2">No bookings found</h3>
              <p className="text-warm-white-dark/60">
                {statusFilter !== 'all' || searchQuery
                  ? 'Try adjusting your filters or search query'
                  : 'No bookings have been made yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="glass-luxury-card border-gold/20 hover:border-gold/40 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Booking Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display font-bold text-lg text-warm-white">
                              {booking.bookingNumber}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-warm-white-dark/60">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4 text-gold/70" />
                              {formatDate(booking.startDate)}
                            </div>
                            {booking.totalAmount && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4 text-gold/70" />
                                <span className="font-semibold text-gold">
                                  ₹{booking.totalAmount.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gold/70" />
                          <span className="text-warm-white">{booking.contactName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gold/70" />
                          <span className="text-warm-white">{booking.contactPhone}</span>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-gold/70 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="text-warm-white-dark/80">
                            <span className="text-gold">From:</span> {booking.pickupLocation?.address || 'N/A'}
                            {booking.pickupLocation?.city && ` (${booking.pickupLocation.city})`}
                          </div>
                          <div className="text-warm-white-dark/80">
                            <span className="text-gold">To:</span> {booking.dropLocation?.address || 'N/A'}
                            {booking.dropLocation?.city && ` (${booking.dropLocation.city})`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle & Actions */}
                    <div className="flex lg:flex-col gap-4 lg:w-64">
                      {booking.vehicle && (
                        <div className="flex items-center gap-3 p-3 bg-gold/5 rounded-lg border border-gold/20">
                          <Bus className="h-5 w-5 text-gold" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-warm-white truncate">{booking.vehicle.name}</div>
                            <div className="text-xs text-warm-white-dark/60">{booking.vehicle.type}</div>
                          </div>
                        </div>
                      )}
                      <Link href={`/admin/bookings/${booking.id}`} className="lg:ml-auto">
                        <Button size="sm" className="bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
