'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Crown, Users, Bus, Calendar, TrendingUp, Shield, Settings } from 'lucide-react'
import { vehicleApi, bookingApi } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch vehicles count
        const vehiclesResponse = await vehicleApi.getVehicles()
        const totalVehicles = vehiclesResponse.data.length

        // Fetch bookings
        const bookingsResponse = await bookingApi.getBookings()
        const bookings = bookingsResponse.data
        const totalBookings = bookings.length
        const pendingBookings = bookings.filter((b: any) => b.status === 'PENDING').length

        // Calculate total revenue from confirmed/completed bookings
        const totalRevenue = bookings
          .filter((b: any) => ['CONFIRMED', 'COMPLETED'].includes(b.status))
          .reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)

        setStats({
          totalVehicles,
          totalBookings,
          pendingBookings,
          totalRevenue
        })
      } catch (err: any) {
        console.error('Failed to load admin stats:', err)
        setError('Failed to load statistics. Please try again later.')

        // Set default values on error
        setStats({
          totalVehicles: 0,
          totalBookings: 0,
          pendingBookings: 0,
          totalRevenue: 0
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/20 to-gold/5 border-b border-gold/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl font-bold text-warm-white mb-2">
                Admin Dashboard
              </h1>
              <p className="text-warm-white-dark/60">Manage your fleet and bookings</p>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-gold" />
              <span className="text-gold font-semibold">Admin</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
              <p className="text-warm-white-dark/60">Loading statistics...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/90"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
          <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/vehicles" className="block group">
            <Card className="glass-luxury-card border-gold/20 h-full group-hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gold">
                  <Bus className="h-5 w-5" />
                  Total Vehicles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warm-white">{stats.totalVehicles}</div>
                <p className="text-sm text-warm-white-dark/60 mt-1">Active fleet</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bookings" className="block group">
            <Card className="glass-luxury-card border-gold/20 h-full group-hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gold">
                  <Calendar className="h-5 w-5" />
                  Total Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warm-white">{stats.totalBookings}</div>
                <p className="text-sm text-warm-white-dark/60 mt-1">All time</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/bookings?status=pending" className="block group">
            <Card className="glass-luxury-card border-gold/20 h-full group-hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gold">
                  <Users className="h-5 w-5" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warm-white">{stats.pendingBookings}</div>
                <p className="text-sm text-warm-white-dark/60 mt-1">Needs action</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/reports" className="block group">
            <Card className="glass-luxury-card border-gold/20 h-full group-hover:border-gold/40 transition-colors cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-gold">
                  <TrendingUp className="h-5 w-5" />
                  Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-warm-white">
                  Rs. {(stats.totalRevenue / 1000).toFixed(0)}k
                </div>
                <p className="text-sm text-warm-white-dark/60 mt-1">This month</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="glass-luxury-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-warm-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/admin/vehicles" className="block p-4 rounded-lg bg-gold/5 hover:bg-gold/10 border border-gold/20 transition-all">
                <div className="flex items-center gap-3">
                  <Bus className="h-5 w-5 text-gold" />
                  <div>
                    <div className="font-semibold text-warm-white">Manage Vehicles</div>
                    <div className="text-sm text-warm-white-dark/60">Add, edit, or remove vehicles</div>
                  </div>
                </div>
              </a>
              <a href="/admin/bookings" className="block p-4 rounded-lg bg-gold/5 hover:bg-gold/10 border border-gold/20 transition-all">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gold" />
                  <div>
                    <div className="font-semibold text-warm-white">View Bookings</div>
                    <div className="text-sm text-warm-white-dark/60">Manage and confirm bookings</div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card className="glass-luxury-card border-gold/20">
            <CardHeader>
              <CardTitle className="text-warm-white">Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a href="/admin/reports" className="block p-4 rounded-lg bg-gold/5 hover:bg-gold/10 border border-gold/20 transition-all">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-gold" />
                  <div>
                    <div className="font-semibold text-warm-white">Reports</div>
                    <div className="text-sm text-warm-white-dark/60">View analytics and reports</div>
                  </div>
                </div>
              </a>
              <a href="/admin/settings" className="block p-4 rounded-lg bg-gold/5 hover:bg-gold/10 border border-gold/20 transition-all">
                <div className="flex items-center gap-3">
                  <Settings className="h-5 w-5 text-gold" />
                  <div>
                    <div className="font-semibold text-warm-white">Settings</div>
                    <div className="text-sm text-warm-white-dark/60">Configure application settings</div>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  )
}
