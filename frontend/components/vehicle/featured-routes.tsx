'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowDown, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'

const featuredRoutes = [
  { id: '1', origin: 'Tirupur', destination: 'Ooty', from: 4999, image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a4?w=400' },
  { id: '2', origin: 'Tirupur', destination: 'Kodaikanal', from: 5999, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400' },
  { id: '3', origin: 'Tirupur', destination: 'Rameshwaram', from: 9999, image: 'https://images.unsplash.com/photo-1580745269650-917dbaa28e74?w=400' },
  { id: '4', origin: 'Tirupur', destination: 'Valparai', from: 5999, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
]

export function FeaturedRoutes() {
  const router = useRouter()

  const handleRouteClick = (route: typeof featuredRoutes[0]) => {
    const params = new URLSearchParams({
      origin: route.origin,
      destination: route.destination,
      date: new Date().toISOString().split('T')[0],
      passengers: '1',
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {featuredRoutes.map((route) => (
          <Card
            key={route.id}
            className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            onClick={() => handleRouteClick(route)}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={route.image}
                alt={route.destination}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
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
