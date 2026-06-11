import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Reports } from '@/components/admin/Reports'

export default function AdminReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="lg:ml-64 p-6">
        <Reports />
      </main>
    </div>
  )
}
