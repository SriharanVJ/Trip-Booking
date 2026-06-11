'use client'

import Link from 'next/link'
import { Car, Menu, X, User, LogIn, ChevronDown, Bell, Settings, LogOut, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: 'Home', href: '/', badge: null },
    { name: 'Fleet', href: '/vehicles', badge: 'Premium' },
    { name: 'My Journeys', href: '/bookings', badge: null },
    { name: 'Experience', href: '/about', badge: null },
  ]

  const userMenuItems = [
    { icon: User, label: 'My Profile', href: '/profile' },
    { icon: Bell, label: 'Notifications', href: '/notifications', badge: '3' },
    { icon: Settings, label: 'Preferences', href: '/settings' },
    { icon: LogOut, label: 'Sign Out', href: '/login' },
  ]

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled
          ? 'glass-luxury border-b border-gold/20 shadow-luxury'
          : 'bg-transparent border-transparent'
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-24 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-gold to-gold-light rounded-xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <div className="relative w-14 h-14 bg-gradient-to-br from-gold to-gold-dark rounded-xl flex items-center justify-center shadow-gold-lg group-hover:shadow-gold-xl transition-all group-hover:scale-105 duration-500 border border-gold/30">
                  <Car className="h-8 w-8 text-black" />
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="font-display text-2xl font-bold text-gradient-gold">
                  AJ Holidays
                </span>
                <div className="text-xs text-gold/80 font-medium tracking-[0.2em] uppercase">
                  Luxury Travel
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative group"
              >
                <div className={cn(
                  'flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-300',
                  'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                )}>
                  {item.name}
                  {item.badge && (
                    <Badge className={cn(
                      'bg-gold/10 text-gold border-gold/30 text-xs px-2.5 py-0.5 font-semibold',
                      'shadow-gold'
                    )}>
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  'absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent',
                  'transition-all duration-300 group-hover:w-8 w-0'
                )}></span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Admin Link */}
            <Link href="/admin">
              <Button
                variant="ghost"
                className={cn(
                  'h-11 px-5 rounded-xl text-sm font-medium transition-all duration-300',
                  'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                )}
              >
                Admin
              </Button>
            </Link>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-11 w-11 rounded-xl relative transition-all duration-300',
                'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
              )}
            >
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-gold text-black text-xs font-bold border-2 border-black">
                3
              </Badge>
            </Button>

            {/* User Menu */}
            <div className="relative">
              <Button
                variant="ghost"
                className={cn(
                  'h-11 px-4 rounded-xl transition-all duration-300 gap-2',
                  'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                )}
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border border-gold/30">
                  <User className="h-4 w-4 text-gold" />
                </div>
                <ChevronDown className={cn(
                  'h-4 w-4 text-gold/60 transition-transform duration-300',
                  userMenuOpen && 'rotate-180'
                )} />
              </Button>

              {/* Dropdown Menu */}
              {userMenuOpen && (
                <div className={cn(
                  'absolute right-0 mt-3 w-60 glass-luxury-card rounded-2xl',
                  'border-gold/20 shadow-luxury-lg py-2 animate-fade-in-luxury'
                )}>
                  <div className="px-5 py-4 border-b border-gold/10">
                    <p className="text-sm font-semibold text-warm-white">Welcome back</p>
                    <p className="text-xs text-warm-white-dark/60 mt-1">guest@example.com</p>
                  </div>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200',
                        'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                      )}
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge className="bg-gold/10 text-gold text-xs font-semibold">{item.badge}</Badge>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            <Link href="/login">
              <Button
                variant="outline"
                className={cn(
                  'h-11 px-6 rounded-xl font-semibold border-gold/40 transition-all duration-300',
                  'text-gold hover:bg-gold/10 hover:border-gold/60'
                )}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className={cn(
                'h-11 px-6 rounded-xl font-semibold bg-gradient-to-r from-gold to-gold-light',
                'text-black hover:from-gold-light hover:to-gold transition-all duration-300',
                'shadow-gold hover:shadow-gold-lg shimmer-gold'
              )}>
                <Crown className="h-4 w-4 mr-2" />
                Join Elite
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className={cn(
                'inline-flex items-center justify-center rounded-xl p-3 transition-all duration-200',
                'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
              )}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={cn(
            'lg:hidden border-t border-gold/10 py-6 animate-fade-in-luxury',
            'glass-luxury'
          )}>
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-5 py-4 rounded-xl font-medium transition-all duration-200',
                    'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                  {item.badge && (
                    <Badge className="bg-gold/10 text-gold border-gold/30 text-xs px-2.5 py-0.5 font-semibold">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gold/10 space-y-3 px-5">
              <Link href="/admin" className="block">
                <Button variant="ghost" className={cn(
                  'w-full justify-start h-13 rounded-xl',
                  'text-warm-white-dark/70 hover:text-gold hover:bg-gold/5'
                )}>
                  Admin Panel
                </Button>
              </Link>
              <Link href="/login" className="block">
                <Button
                  variant="outline"
                  className={cn(
                    'w-full h-13 rounded-xl font-semibold border-gold/40',
                    'text-gold hover:bg-gold/10'
                  )}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/register" className="block">
                <Button className={cn(
                  'w-full h-13 rounded-xl font-semibold',
                  'bg-gradient-to-r from-gold to-gold-light text-black',
                  'shadow-gold hover:shadow-gold-lg'
                )}>
                  <Crown className="h-4 w-4 mr-2" />
                  Join Elite Circle
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Progress Bar - Gold */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold/50 to-transparent overflow-hidden">
        <div className="h-full w-1/3 bg-gradient-to-r from-gold/20 via-gold/40 to-gold/20 animate-shimmer-gold"></div>
      </div>
    </header>
  )
}
