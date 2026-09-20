import { useParams } from '@travels/lib/navigation'
import { BookingPageClient } from './BookingPageClient'

export default function BookingPage() {
  const params = useParams()

  return <BookingPageClient vehicleId={params.vehicleId} />
}
