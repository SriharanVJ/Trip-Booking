import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { VehicleManagement } from '@/components/admin/VehicleManagement'

export default function AdminVehiclesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <VehicleManagement />
      </main>
    </div>
  )
}
