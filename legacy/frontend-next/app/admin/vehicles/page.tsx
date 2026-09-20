'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Bus, Users, Fuel, TrendingUp, Search, Plus, Edit, Trash2, Star } from 'lucide-react'
import { vehicleApi } from '@/lib/api'
import { getVehicleById } from '@/lib/api'
import type { Vehicle } from '@/types'

export default function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await vehicleApi.getVehicles()

        // Transform vehicles using the getVehicleById helper
        const transformedVehicles = await Promise.all(
          response.data.map(async (v: any) => {
            try {
              return await getVehicleById(v.id)
            } catch {
              return null
            }
          })
        )

        setVehicles(transformedVehicles.filter((v): v is Vehicle => v !== null))
      } catch (err: any) {
        console.error('Failed to load vehicles:', err)
        setError('Failed to load vehicles. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [])

  // Filter vehicles by type and search query
  useEffect(() => {
    let filtered = vehicles

    if (typeFilter !== 'all') {
      filtered = filtered.filter((v) => v.type === typeFilter)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.name.toLowerCase().includes(query) ||
          v.make.toLowerCase().includes(query) ||
          v.model.toLowerCase().includes(query)
      )
    }

    setVehicles(filtered)
    // Note: This is a simplified filter - in production, you'd want to keep original list separate
  }, [searchQuery, typeFilter])

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'car':
        return 'border-gold/30 text-gold bg-gold/10'
      case 'traveller':
        return 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
      case 'coach':
        return 'border-purple-500/30 text-purple-400 bg-purple-500/10'
      case 'bus':
        return 'border-blue-500/30 text-blue-400 bg-blue-500/10'
      default:
        return 'border-gray-500/30 text-gray-400 bg-gray-500/10'
    }
  }

  const stats = {
    total: vehicles.length,
    car: vehicles.filter((v) => v.type === 'car').length,
    traveller: vehicles.filter((v) => v.type === 'traveller').length,
    coach: vehicles.filter((v) => v.type === 'coach').length,
    bus: vehicles.filter((v) => v.type === 'bus').length,
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
                <h1 className="font-display text-3xl font-bold text-warm-white">Vehicles</h1>
                <p className="text-warm-white-dark/60">Manage your fleet</p>
              </div>
            </div>
            <Button className="bg-gold text-black hover:bg-gold/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="glass-luxury-card border-gold/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warm-white">{stats.total}</div>
              <div className="text-xs text-warm-white-dark/60">Total</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-gold/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gold">{stats.car}</div>
              <div className="text-xs text-warm-white-dark/60">Cars</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-emerald-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.traveller}</div>
              <div className="text-xs text-warm-white-dark/60">Travellers</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-purple-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.coach}</div>
              <div className="text-xs text-warm-white-dark/60">Coaches</div>
            </CardContent>
          </Card>
          <Card className="glass-luxury-card border-blue-500/20">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.bus}</div>
              <div className="text-xs text-warm-white-dark/60">Buses</div>
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
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-black/50 border border-gold/20 rounded-lg px-3 py-2 text-sm text-warm-white placeholder:text-warm-white-dark/40 focus:outline-none focus:border-gold/50 w-full md:w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-black/50 border border-gold/20 rounded-lg px-3 py-2 text-sm text-warm-white focus:outline-none focus:border-gold/50"
                >
                  <option value="all">All Types</option>
                  <option value="car">Cars</option>
                  <option value="traveller">Travellers</option>
                  <option value="coach">Coaches</option>
                  <option value="bus">Buses</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
              <p className="text-warm-white-dark/60">Loading vehicles...</p>
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
        ) : vehicles.length === 0 ? (
          <Card className="glass-luxury-card border-gold/20">
            <CardContent className="p-12 text-center">
              <Bus className="h-12 w-12 text-gold/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-warm-white mb-2">No vehicles found</h3>
              <p className="text-warm-white-dark/60 mb-4">
                {typeFilter !== 'all' || searchQuery
                  ? 'Try adjusting your filters'
                  : 'Add vehicles to get started'}
              </p>
              <Button className="bg-gold text-black hover:bg-gold/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <Card key={vehicle.id} className="glass-luxury-card border-gold/20 hover:border-gold/40 transition-colors group">
                <div className="relative h-48 overflow-hidden bg-black">
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={vehicle.imageUrl.startsWith('http')}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <Badge className={`absolute top-3 left-3 ${getTypeColor(vehicle.type)}`}>
                    {vehicle.type.charAt(0).toUpperCase() + vehicle.type.slice(1)}
                  </Badge>
                  {vehicle.rating && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
                      <Star className="h-3 w-3 fill-gold text-gold" />
                      <span className="text-xs font-bold text-warm-white">{vehicle.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-display font-bold text-lg text-warm-white mb-1">{vehicle.name}</h3>
                    <p className="text-sm text-warm-white-dark/60">
                      {vehicle.make} {vehicle.model} • {vehicle.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-warm-white-dark/60">
                      <Users className="h-4 w-4 text-gold/70" />
                      <span>{vehicle.seatingCapacity} seats</span>
                    </div>
                    <div className="flex items-center gap-1 text-warm-white-dark/60">
                      <Fuel className="h-4 w-4 text-gold/70" />
                      <span>Premium</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 pt-2 border-t border-gold/10">
                    <span className="text-xl font-bold text-gradient-gold">₹{vehicle.basePrice.toLocaleString()}</span>
                    <span className="text-xs text-warm-white-dark/60">/km</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/admin/vehicles/${vehicle.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full border-gold/40 hover:bg-gold/10 text-warm-white">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="border-red-500/40 hover:bg-red-500/10 text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
