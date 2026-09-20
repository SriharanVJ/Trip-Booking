'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { routesApi } from '@/lib/api'

interface FeaturedRoute {
  id: string
  origin: string
  destination: string
  description?: string
  from: number
  image?: string | null
  vehicleType?: string
  seatingCapacity?: number
}

export function FeaturedRoutes() {
  const router = useRouter()
  const [routes, setRoutes] = useState<FeaturedRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true)
        const response = await routesApi.getFeaturedRoutes()
        setRoutes(response.data)
      } catch (err) {
        console.error('Failed to load featured routes:', err)
        setError('Failed to load featured routes')
        // Set default routes on error
        setRoutes([
          { id: '1', origin: 'Tirupur', destination: 'Ooty', from: 4999 },
          { id: '2', origin: 'Tirupur', destination: 'Kodaikanal', from: 5999 },
          { id: '3', origin: 'Tirupur', destination: 'Rameshwaram', from: 9999 },
          { id: '4', origin: 'Tirupur', destination: 'Valparai', from: 5999 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRoutes()
  }, [])

  const handleRouteClick = (route: FeaturedRoute) => {
    const params = new URLSearchParams({
      origin: route.origin,
      destination: route.destination,
      date: new Date().toISOString().split('T')[0],
      passengers: '1',
    })
    router.push(`/search?${params.toString()}`)
  }

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && routes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load featured routes</p>
      </div>
    )
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {routes.map((route) => (
          <Card
            key={route.id}
            className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            onClick={() => handleRouteClick(route)}
          >
            <div className="relative h-48 overflow-hidden">
              {route.image ? (
                <img
                  src={route.image}
                  alt={route.destination}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <MapPin className="h-16 w-16 text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Destination badge */}
              <div className="absolute top-4 left-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-gray-900">{route.destination}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="absolute bottom-4 right-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl px-4 py-2 shadow-lg">
                  <p className="text-xs text-blue-100">Starting from</p>
                  <p className="text-xl font-bold">Rs. {route.from.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <CardContent className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">from</p>
                    <p className="font-semibold text-gray-900">{route.origin}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">per day</p>
                  <p className="font-semibold text-gray-900">{route.from}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
