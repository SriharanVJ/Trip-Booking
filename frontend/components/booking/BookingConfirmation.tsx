'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle, Download, Share2, Home, FileText, Mail, Phone, MapPin, Calendar, Clock, Users, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn, formatDate, formatTime, formatCurrency } from '@/lib/utils'
import type { BookingResponse, TripDetails, CustomerInfo } from '@/types/booking'
import type { Vehicle } from '@/types'

interface BookingConfirmationProps {
  booking: BookingResponse
  vehicle: Vehicle
  trip: TripDetails
  customer: CustomerInfo
  amount: number
}

export function BookingConfirmation({ booking, vehicle, trip, customer, amount }: BookingConfirmationProps) {
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Auto-hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    window.print()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trip Booking Confirmation',
          text: `Your booking ${booking.bookingNumber} has been confirmed!`,
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-green-900">Booking Confirmed!</h1>
              <p className="text-green-700">
                Your booking has been successfully completed. We've sent the confirmation to your email.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Number */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Booking Number</p>
            <p className="text-3xl font-mono font-bold tracking-wider">{booking.bookingNumber}</p>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Confirmed
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Vehicle */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="h-20 w-24 rounded-lg overflow-hidden bg-muted">
              <img src={vehicle.imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{vehicle.type}</Badge>
                <Badge variant="outline">{vehicle.seatingCapacity} seats</Badge>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Trip Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Trip Type</p>
                <p className="font-medium capitalize">{trip.tripType.replace('-', ' ')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Passengers</p>
                <p className="font-medium">{trip.passengerCount}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pickup</p>
                <p className="font-medium">{trip.pickupLocation?.name}, {trip.pickupLocation?.city}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Drop</p>
                <p className="font-medium">{trip.dropLocation?.name}, {trip.dropLocation?.city}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Pickup Date & Time</p>
                <p className="font-medium">
                  {formatDate(trip.pickupDate)} at {trip.pickupTime}
                </p>
              </div>
              {trip.tripType === 'round-trip' && trip.returnDate && (
                <div>
                  <p className="text-muted-foreground">Return Date & Time</p>
                  <p className="font-medium">
                    {formatDate(trip.returnDate)} at {trip.returnTime}
                  </p>
                </div>
              )}
              {trip.estimatedDistance && (
                <div>
                  <p className="text-muted-foreground">Estimated Distance</p>
                  <p className="font-medium">{trip.estimatedDistance} km</p>
                </div>
              )}
              {trip.estimatedDuration && (
                <div>
                  <p className="text-muted-foreground">Estimated Duration</p>
                  <p className="font-medium">{formatDuration(trip.estimatedDuration)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Contact Information
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium flex items-center gap-2">
              <IndianRupee className="h-4 w-4" />
              Payment Summary
            </h4>

            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total Amount Paid</span>
              <span className="text-primary">{formatCurrency(amount)}</span>
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p>Payment Status: <span className="text-green-600 font-medium">Paid</span></p>
              <p>Booking Date: {formatDate(booking.createdAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Check your email</p>
                <p className="text-muted-foreground">We've sent a confirmation email with all the booking details to {customer.email}</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Driver will contact you</p>
                <p className="text-muted-foreground">Your driver will reach out to you {trip.pickupDate === trip.returnDate ? '2 hours' : '1 day'} before pickup</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Be ready for pickup</p>
                <p className="text-muted-foreground">Please be at the pickup location at least 15 minutes before the scheduled time</p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" size="lg" className="flex-1" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button variant="outline" size="lg" className="flex-1" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share Booking
            </Button>
            <Link href="/my-bookings" className="flex-1">
              <Button size="lg" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View My Bookings
              </Button>
            </Link>
          </div>

          <Link href="/" className="block mt-4 text-center">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">Need Help?</p>
              <p className="text-sm text-blue-700">
                Contact our support team at <a href="tel:1800123456" className="underline">1800-123-456</a> or email us at <a href="mailto:support@example.com" className="underline">support@example.com</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
