'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import {
  Sparkles,
  Shield,
  Clock,
  Star,
  TrendingUp,
  Users,
  Award,
  MapPin,
  ArrowRight,
  Check,
  ChevronRight,
  Zap,
  Crown,
  Gem,
} from 'lucide-react'

// Dynamic imports for code splitting - load heavy components only when needed
const BusSearch = dynamic(() => import('@/components/vehicle/bus-search').then(mod => ({ default: mod.BusSearch })), {
  loading: () => (
    <div className="h-20 bg-charcoal-dark/30 rounded-2xl animate-pulse" />
  ),
  ssr: false, // Don't render on server for faster initial load
})

const FeaturedRoutes = dynamic(() => import('@/components/vehicle/featured-routes').then(mod => ({ default: mod.FeaturedRoutes })), {
  loading: () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-48 bg-charcoal-dark/30 rounded-2xl animate-pulse" />
      ))}
    </div>
  ),
})

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setIsLoaded(true)
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: Crown,
      title: 'Luxury Fleet',
      description: 'Premium vehicles with gold-standard comfort and sophistication',
      color: 'text-gold',
      gradient: 'from-gold/20 to-gold/5',
      borderColor: 'border-gold/30',
    },
    {
      icon: Shield,
      title: 'Verified Excellence',
      description: 'Every vehicle meticulously inspected and fully insured',
      color: 'text-emerald-400',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      borderColor: 'border-emerald-500/30',
    },
    {
      icon: Users,
      title: 'Elite Service',
      description: 'Dedicated concierge and professional chauffeurs at your service',
      color: 'text-blue-400',
      gradient: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/30',
    },
    {
      icon: Gem,
      title: 'Exclusive Access',
      description: 'Curated experiences and priority bookings for members',
      color: 'text-purple-400',
      gradient: 'from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/30',
    },
  ]

  const testimonials = [
    {
      text: 'An absolutely exceptional experience. The vehicle was immaculate and the service was impeccable.',
      author: 'Vikram R.',
      role: 'Business Executive',
      rating: 5,
    },
    {
      text: 'From booking to drop-off, every detail was handled with sophistication and care.',
      author: 'Priya M.',
      role: 'Travel Enthusiast',
      rating: 5,
    },
    {
      text: 'The gold standard in luxury travel. Our family trip was elevated beyond expectations.',
      author: 'Arun K.',
      role: 'Family Traveler',
      rating: 5,
    },
  ]

  const popularRoutes = [
    { city: 'Chennai', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a4?w=400', bookings: 1247 },
    { city: 'Ooty', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400', bookings: 892 },
    { city: 'Kodaikanal', image: 'https://images.unsplash.com/photo-1580745269650-917dbaa28e74?w=400', bookings: 756 },
    { city: 'Madurai', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400', bookings: 634 },
  ]

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[95vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-charcoal-dark to-black">
          <div className="absolute inset-0 particles-container opacity-40" />
          <div className="absolute inset-0 bg-gradient-luxury-mesh" />
          <div className="absolute inset-0 pattern-luxury-grid opacity-20" />
          <div className="absolute inset-0 pattern-luxury-dots opacity-10" />
          <div className="absolute top-20 left-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-float-luxury" />
          <div className="absolute top-40 right-20 w-[30rem] h-[30rem] bg-gold/8 rounded-full blur-3xl animate-float-luxury" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-20 left-1/3 w-[28rem] h-[28rem] bg-gold/6 rounded-full blur-3xl animate-float-luxury" style={{ animationDelay: '2s' }} />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1920&q=80')",
              transform: 'translateY(0px)'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div
            className={`max-w-5xl mx-auto transition-all duration-1000 ease-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
          >
            {/* Badge */}
            <div className="flex justify-center mb-10">
              <Badge className="glass-luxury px-6 py-2.5 text-sm font-medium border-gold text-gold shadow-gold-lg animate-fade-in-luxury">
                <Crown className="w-4 h-4 mr-2 animate-gold-pulse" />
                Premium Travel Experience
                <ChevronRight className="w-4 h-4 ml-2" />
              </Badge>
            </div>

            {/* Heading */}
            <div className="text-center mb-10">
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold text-warm-white mb-8 leading-tight tracking-tight">
                Your Journey,
                <br />
                <span className="text-gradient-gold animate-shimmer-gold">Our Legacy</span>
              </h1>
              <p className="text-xl md:text-2xl text-warm-white-dark/80 mb-6 max-w-3xl mx-auto leading-relaxed font-light">
                Experience Tamil Nadu through the lens of luxury with our curated premium fleet
              </p>
              <p className="text-lg text-warm-white-dark/60 max-w-2xl mx-auto font-light">
                From intimate sedan transfers to majestic luxury coaches, we craft journeys that transcend ordinary travel
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-12 text-warm-white-dark/70">
              {[
                { icon: Check, text: 'Verified Excellence' },
                { icon: Shield, text: 'Premium Guarantee' },
                { icon: Star, text: 'Elite Rating' },
                { icon: Users, text: '10k+ Distinguished Guests' },
              ].map((item, index) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-sm font-medium tracking-wide animate-fade-in-luxury"
                  style={{ animationDelay: `${0.3 + index * 0.1}s` }}
                >
                  <item.icon className="w-5 h-5 text-gold" />
                  <span className="text-warm-white">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Search Form - Now loaded dynamically */}
            <div className="glass-luxury-card rounded-3xl p-8 md:p-12 shadow-luxury-lg max-w-4xl mx-auto border-gold-thick animate-scale-in-luxury" style={{ animationDelay: '0.4s' }}>
              <BusSearch />
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2 text-warm-white-dark/40">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronRight className="w-5 h-5 rotate-90" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 border-t border-gold/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-luxury border-gold text-gold">
              <Sparkles className="w-4 h-4 mr-1" />
              Why Choose AJ Holidays
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-6">
              The Gold Standard
            </h2>
            <p className="text-xl text-warm-white-dark/60 max-w-2xl mx-auto">
              Every detail meticulously crafted for the most discerning travelers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="glass-luxury-card rounded-3xl p-8 border-gold/10 hover:border-gold/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-gold/20">
                    <div
                      className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.borderColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                    >
                      <Icon className={`w-8 h-8 ${feature.color}`} />
                    </div>
                    <h3 className="font-display text-xl font-bold text-warm-white mb-3 group-hover:text-gold transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-warm-white-dark/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Popular Routes - Now loaded dynamically */}
      <section className="py-24 md:py-32 border-t border-gold/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <Badge className="mb-4 glass-luxury border-gold text-gold">
                <TrendingUp className="w-4 h-4 mr-1" />
                Trending
              </Badge>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-4">
                Popular Destinations
              </h2>
              <p className="text-warm-white-dark/60 text-lg">
                Most sought-after journeys by our distinguished guests
              </p>
            </div>
            <Button
              variant="outline"
              className="border-gold/40 hover:bg-gold/5 text-warm-white hover:text-gold rounded-xl h-12 px-6"
              onClick={() => (window.location.href = '/vehicles')}
            >
              View All Routes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <FeaturedRoutes />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 md:py-32 border-t border-gold/10 bg-gradient-to-b from-black via-charcoal-dark/50 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 glass-luxury border-gold text-gold">
              <Star className="w-4 h-4 mr-1" />
              Reviews
            </Badge>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-warm-white mb-6">
              Distinguished Guests Speak
            </h2>
            <p className="text-xl text-warm-white-dark/60 max-w-2xl mx-auto">
              Experiences that define our commitment to excellence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-luxury-card rounded-3xl p-8 border-gold/10 hover:border-gold/20 transition-all duration-500 hover:-translate-y-2"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                  ))}
                </div>
                <p className="text-warm-white-dark/80 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div>
                  <div className="font-semibold text-warm-white">{testimonial.author}</div>
                  <div className="text-sm text-warm-white-dark/60">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-t border-gold/10">
        <div className="container mx-auto px-4">
          <div className="glass-luxury-card rounded-3xl p-12 md:p-16 border-gold/20">
            <div className="grid md:grid-cols-4 gap-12 text-center">
              {[
                { label: 'Premium Vehicles', value: '150+' },
                { label: 'Distinguished Guests', value: '10,000+' },
                { label: 'Cities Covered', value: '35+' },
                { label: 'Years of Excellence', value: '12+' },
              ].map((stat, index) => (
                <div key={stat.label}>
                  <div className="font-display text-5xl md:text-6xl font-bold text-gradient-gold mb-2">
                    {stat.value}
                  </div>
                  <div className="text-warm-white-dark/60 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 border-t border-gold/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5" />
        <div className="relative container mx-auto px-4 text-center">
          <Badge className="mb-6 glass-luxury border-gold text-gold">
            <Crown className="w-4 h-4 mr-1" />
            Elite Access
          </Badge>
          <h2 className="font-display text-5xl md:text-6xl font-bold text-warm-white mb-6">
            Begin Your Luxury Journey
          </h2>
          <p className="text-xl text-warm-white-dark/70 mb-10 max-w-2xl mx-auto">
            Join our exclusive membership for priority bookings, special rates, and curated experiences
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button
              size="lg"
              className="h-14 px-8 bg-gradient-to-r from-gold to-gold-light text-black hover:from-gold-light hover:to-gold font-display font-semibold rounded-xl shadow-gold-lg shimmer-gold"
              onClick={() => (window.location.href = '/vehicles')}
            >
              Explore Fleet
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 bg-transparent text-gold border-2 border-gold/40 hover:bg-gold/10 hover:border-gold/60 font-display font-semibold rounded-xl backdrop-blur transition-all"
              onClick={() => (window.location.href = '/register')}
            >
              Join Membership
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
