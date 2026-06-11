import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { DashboardStats } from '@/components/admin/DashboardStats'

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <DashboardStats />
      </main>
    </div>
  )
}
