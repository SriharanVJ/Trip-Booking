'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const routes = [
  { id: '1', origin: 'Ooty', destination: 'Boston', distance: 215, duration: 240, popular: true },
  { id: '2', origin: 'Los Angeles', destination: 'San Francisco', distance: 382, duration: 360, popular: true },
  { id: '3', origin: 'Chicago', destination: 'Detroit', distance: 283, duration: 300, popular: false },
  { id: '4', origin: 'Seattle', destination: 'Portland', distance: 173, duration: 180, popular: true },
  { id: '5', origin: 'Miami', destination: 'Orlando', distance: 235, duration: 240, popular: true },
  { id: '6', origin: 'Atlanta', destination: 'Nashville', distance: 249, duration: 270, popular: false },
]

export default function RoutesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filteredRoutes, setFilteredRoutes] = useState(routes)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    setFilteredRoutes(
      routes.filter(
        (route) =>
          route.origin.toLowerCase().includes(value.toLowerCase()) ||
          route.destination.toLowerCase().includes(value.toLowerCase())
      )
    )
  }

  const handleRouteClick = (route: typeof routes[0]) => {
    const params = new URLSearchParams({
      origin: route.origin,
      destination: route.destination,
      date: new Date().toISOString().split('T')[0],
      passengers: '1',
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Routes</h1>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search routes..."
            value={search}
            onChange={handleSearch}
            className="pl-10 max-w-md"
          />
        </div>
      </div>

      {/* Routes List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRoutes.map((route) => (
          <Card
            key={route.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleRouteClick(route)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{route.origin}</h3>
                  <p className="text-sm text-gray-500">to {route.destination}</p>
                </div>
                {route.popular && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    Popular
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{route.distance} km</span>
                <span>{Math.floor(route.duration / 60)}h {route.duration % 60}m</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRoutes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No routes found matching your search.</p>
        </div>
      )}
    </div>
  )
}
