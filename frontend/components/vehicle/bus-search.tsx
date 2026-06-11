'use client'

import { useState } from 'react'
import { Search, Calendar, Users, MapPin, ChevronDown, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

// Tamil Nadu cities list
const tamilNaduCities = [
  'Tirupur',
  'Coimbatore',
  'Ooty',
  'Kodaikanal',
  'Rameshwaram',
  'Valparai',
  'Chennai',
  'Madurai',
  'Trichy',
  'Salem',
  'Erode',
  'Tirunelveli',
  'Vellore',
  'Thanjavur',
  'Dindigul',
  'Karur',
  'Nagercoil',
  'Kanyakumari',
  'Pollachi',
  'Hosur',
  'Dharmapuri',
  'Krishnagiri',
  'Namakkal',
  'Nagapattinam',
  'Pudukkottai',
  'Sivaganga',
  'Virudhunagar',
  'Theni',
  'Ramnad',
  'Sivagangai',
  'Ramanathapuram',
  'Cuddalore',
  'Villupuram',
  'Tiruvallur',
  'Kanchipuram',
  'Tiruvannamalai',
  'Ariyalur',
  'Perambalur',
  'Thoothukudi',
]

export function BusSearch() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState({
    origin: '',
    destination: '',
    date: '',
    passengers: 1,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchParams.origin || !searchParams.destination || !searchParams.date) {
      return
    }

    // Validate origin and destination are different
    if (searchParams.origin === searchParams.destination) {
      alert('Origin and destination cannot be the same. Please select different cities.')
      return
    }

    const params = new URLSearchParams({
      origin: searchParams.origin,
      destination: searchParams.destination,
      date: searchParams.date,
      passengers: searchParams.passengers.toString(),
    })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="space-y-6">
      <div className="grid md:grid-cols-4 gap-5">
        {/* Origin - Dropdown */}
        <div className="relative group">
          <label className="block text-sm font-medium text-gold/90 mb-3 tracking-wide">
            From
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gold/70 group-focus-within:text-gold transition-colors duration-300" />
            </div>
            <select
              value={searchParams.origin}
              onChange={(e) =>
                setSearchParams({ ...searchParams, origin: e.target.value })
              }
              className={`
                w-full h-14 rounded-xl border-2 bg-black/50 backdrop-blur-sm
                px-4 py-3 pl-12 pr-10 text-sm text-warm-white
                appearance-none cursor-pointer transition-all duration-300
                border-gold/20 hover:border-gold/40 focus:border-gold/60
                focus:ring-2 focus:ring-gold/20 focus:bg-black/70
                outline-none
              `}
              required
            >
              <option value="" className="text-warm-white-dark bg-charcoal-dark">
                Departure city
              </option>
              {tamilNaduCities.map((city) => (
                <option
                  key={city}
                  value={city}
                  className="text-warm-white bg-charcoal-dark hover:bg-gold/10"
                >
                  {city}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gold/50 group-focus-within:text-gold transition-colors duration-300" />
            </div>
          </div>
        </div>

        {/* Destination - Dropdown */}
        <div className="relative group">
          <label className="block text-sm font-medium text-gold/90 mb-3 tracking-wide">
            To
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gold/70 group-focus-within:text-gold transition-colors duration-300" />
            </div>
            <select
              value={searchParams.destination}
              onChange={(e) =>
                setSearchParams({ ...searchParams, destination: e.target.value })
              }
              className={`
                w-full h-14 rounded-xl border-2 bg-black/50 backdrop-blur-sm
                px-4 py-3 pl-12 pr-10 text-sm text-warm-white
                appearance-none cursor-pointer transition-all duration-300
                border-gold/20 hover:border-gold/40 focus:border-gold/60
                focus:ring-2 focus:ring-gold/20 focus:bg-black/70
                outline-none
              `}
              required
            >
              <option value="" className="text-warm-white-dark bg-charcoal-dark">
                Arrival city
              </option>
              {tamilNaduCities.map((city) => (
                <option
                  key={city}
                  value={city}
                  className="text-warm-white bg-charcoal-dark hover:bg-gold/10"
                >
                  {city}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gold/50 group-focus-within:text-gold transition-colors duration-300" />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="relative group">
          <label className="block text-sm font-medium text-gold/90 mb-3 tracking-wide">
            Travel Date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Calendar className="h-5 w-5 text-gold/70 group-focus-within:text-gold transition-colors duration-300" />
            </div>
            <input
              type="date"
              value={searchParams.date}
              onChange={(e) =>
                setSearchParams({ ...searchParams, date: e.target.value })
              }
              className={`
                w-full h-14 rounded-xl border-2 bg-black/50 backdrop-blur-sm
                px-4 py-3 pl-12 text-sm text-warm-white
                cursor-pointer transition-all duration-300
                border-gold/20 hover:border-gold/40 focus:border-gold/60
                focus:ring-2 focus:ring-gold/20 focus:bg-black/70
                outline-none
                [color-scheme:dark]
              `}
              style={{ userSelect: 'none' }}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
        </div>

        {/* Passengers */}
        <div className="relative group">
          <label className="block text-sm font-medium text-gold/90 mb-3 tracking-wide">
            Guests
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gold/70 group-focus-within:text-gold transition-colors duration-300" />
            </div>
            <input
              type="number"
              min="1"
              max="50"
              value={searchParams.passengers}
              onChange={(e) =>
                setSearchParams({
                  ...searchParams,
                  passengers: parseInt(e.target.value) || 1,
                })
              }
              className={`
                w-full h-14 rounded-xl border-2 bg-black/50 backdrop-blur-sm
                px-4 py-3 pl-12 text-sm text-warm-white
                transition-all duration-300
                border-gold/20 hover:border-gold/40 focus:border-gold/60
                focus:ring-2 focus:ring-gold/20 focus:bg-black/70
                outline-none
              `}
              required
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className={`
          w-full h-14 rounded-xl font-display font-semibold text-base
          bg-gradient-to-r from-gold to-gold-light text-black
          hover:from-gold-light hover:to-gold
          shadow-gold-lg hover:shadow-gold-xl
          transition-all duration-300 hover:-translate-y-0.5
          flex items-center justify-center gap-3
          shimmer-gold border border-gold/40
        `}
      >
        <Search className="h-5 w-5" />
        Discover Premium Fleet
        <ArrowRight className="h-5 w-5" />
      </Button>

      {/* Trust Indicators */}
      <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-warm-white-dark/50">
        {[
          { icon: Search, text: 'Instant Confirmation' },
          { icon: Sparkles, text: 'Best Price Guarantee' },
          { icon: Users, text: '24/7 Concierge' },
        ].map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 font-medium tracking-wide"
          >
            <item.icon className="h-4 w-4 text-gold/60" />
            <span className="text-warm-white-dark/60">{item.text}</span>
          </div>
        ))}
      </div>
    </form>
  )
}
