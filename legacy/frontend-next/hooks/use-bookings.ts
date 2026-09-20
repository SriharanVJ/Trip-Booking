import { useState, useEffect } from 'react'
import { bookingApi } from '@/lib/api'
import type { Booking } from '@/types'

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingApi.getBookings()
      setBookings(response.data)
    } catch (err) {
      setError('Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (id: string) => {
    try {
      await bookingApi.cancelBooking(id)
      setBookings(bookings.filter((b) => b.id !== id))
    } catch (err) {
      setError('Failed to cancel booking')
    }
  }

  return { bookings, loading, error, cancelBooking, refetch: fetchBookings }
}
