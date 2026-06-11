import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BookingForm } from '@/components/booking/BookingForm'
import { TripSummarySidebar } from '@/components/booking/TripSummarySidebar'
import { getVehicleById } from '@/lib/api'

interface BookingPageProps {
  params: {
    vehicleId: string
  }
}

export async function generateMetadata({ params }: BookingPageProps): Promise<Metadata> {
  const vehicle = await getVehicleById(params.vehicleId)

  if (!vehicle) {
    return {
      title: 'Vehicle Not Found'
    }
  }

  return {
    title: `Book ${vehicle.name} - Trip Booking`,
    description: `Book ${vehicle.name} for your journey. ${vehicle.description}`
  }
}

export default async function BookingPage({ params }: BookingPageProps) {
  const vehicle = await getVehicleById(params.vehicleId)

  if (!vehicle) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Booking Form */}
        <div className="lg:col-span-2">
          <BookingForm vehicle={vehicle} />
        </div>

        {/* Trip Summary Sidebar */}
        <div className="lg:col-span-1">
          <TripSummarySidebar vehicle={vehicle} />
        </div>
      </div>
    </div>
  )
}
