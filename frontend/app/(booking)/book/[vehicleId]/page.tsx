import { Metadata } from 'next'
import { BookingPageClient } from './BookingPageClient'

interface BookingPageProps {
  params: Promise<{
    vehicleId: string
  }>
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const { vehicleId } = await params

  return {
    title: 'Book Your Trip - Bus Booking',
    description: 'Complete your booking for your selected vehicle'
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { vehicleId } = await params

  return <BookingPageClient vehicleId={vehicleId} />
}
