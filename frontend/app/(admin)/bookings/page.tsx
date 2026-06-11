import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { BookingManagement } from '@/components/admin/BookingManagement'

export default function AdminBookingsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <BookingManagement />
      </main>
    </div>
  )
}
