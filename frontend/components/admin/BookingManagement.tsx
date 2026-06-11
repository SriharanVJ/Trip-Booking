'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
  Check,
  X,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  MapPin,
  Clock,
  User
} from 'lucide-react'
import { Booking, BookingStatus, PassengerDetails } from '@/types'
import { formatCurrency, formatDateTime } from '@/lib/utils'

// Mock data
const mockBookings: (Booking & {
  customerName: string
  customerEmail: string
  customerPhone: string
  route: string
  travelDate: string
  departureTime: string
  arrivalTime: string
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded'
})[] = [
  {
    id: 'BKG-001',
    scheduleId: 'SCH-001',
    seats: [1, 2, 3],
    status: 'confirmed',
    totalAmount: 4500,
    passengerDetails: [
      { name: 'John Doe', email: 'john@example.com', phone: '+91 98765 43210' },
      { name: 'Jane Doe', email: 'jane@example.com', phone: '+91 98765 43211' },
      { name: 'Jim Doe', email: 'jim@example.com', phone: '+91 98765 43212' },
    ],
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-15T10:35:00',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+91 98765 43210',
    route: 'Chennai → Bangalore',
    travelDate: '2024-01-20',
    departureTime: '06:00',
    arrivalTime: '12:30',
    paymentStatus: 'completed',
  },
  {
    id: 'BKG-002',
    scheduleId: 'SCH-002',
    seats: [5, 6],
    status: 'pending',
    totalAmount: 2800,
    passengerDetails: [
      { name: 'Mike Wilson', email: 'mike@example.com', phone: '+91 98765 43213' },
      { name: 'Sarah Wilson', email: 'sarah@example.com', phone: '+91 98765 43214' },
    ],
    createdAt: '2024-01-15T11:00:00',
    updatedAt: '2024-01-15T11:00:00',
    customerName: 'Mike Wilson',
    customerEmail: 'mike@example.com',
    customerPhone: '+91 98765 43213',
    route: 'Bangalore → Hyderabad',
    travelDate: '2024-01-22',
    departureTime: '08:00',
    arrivalTime: '15:00',
    paymentStatus: 'pending',
  },
  {
    id: 'BKG-003',
    scheduleId: 'SCH-003',
    seats: [10],
    status: 'completed',
    totalAmount: 1500,
    passengerDetails: [
      { name: 'Emma Brown', email: 'emma@example.com', phone: '+91 98765 43215' },
    ],
    createdAt: '2024-01-10T09:00:00',
    updatedAt: '2024-01-10T18:00:00',
    customerName: 'Emma Brown',
    customerEmail: 'emma@example.com',
    customerPhone: '+91 98765 43215',
    route: 'Hyderabad → Chennai',
    travelDate: '2024-01-12',
    departureTime: '21:00',
    arrivalTime: '06:00',
    paymentStatus: 'completed',
  },
  {
    id: 'BKG-004',
    scheduleId: 'SCH-004',
    seats: [15, 16, 17, 18],
    status: 'cancelled',
    totalAmount: 6000,
    passengerDetails: [
      { name: 'Alex Johnson', email: 'alex@example.com', phone: '+91 98765 43216' },
      { name: 'Betty Johnson', email: 'betty@example.com', phone: '+91 98765 43217' },
      { name: 'Chris Johnson', email: 'chris@example.com', phone: '+91 98765 43218' },
      { name: 'Daisy Johnson', email: 'daisy@example.com', phone: '+91 98765 43219' },
    ],
    createdAt: '2024-01-12T14:00:00',
    updatedAt: '2024-01-13T10:00:00',
    customerName: 'Alex Johnson',
    customerEmail: 'alex@example.com',
    customerPhone: '+91 98765 43216',
    route: 'Chennai → Coimbatore',
    travelDate: '2024-01-25',
    departureTime: '07:00',
    arrivalTime: '13:00',
    paymentStatus: 'refunded',
  },
  {
    id: 'BKG-005',
    scheduleId: 'SCH-005',
    seats: [20, 21],
    status: 'confirmed',
    totalAmount: 3200,
    passengerDetails: [
      { name: 'Frank Miller', email: 'frank@example.com', phone: '+91 98765 43220' },
      { name: 'Grace Miller', email: 'grace@example.com', phone: '+91 98765 43221' },
    ],
    createdAt: '2024-01-14T16:00:00',
    updatedAt: '2024-01-14T16:05:00',
    customerName: 'Frank Miller',
    customerEmail: 'frank@example.com',
    customerPhone: '+91 98765 43220',
    route: 'Bangalore → Mumbai',
    travelDate: '2024-01-28',
    departureTime: '16:00',
    arrivalTime: '08:00',
    paymentStatus: 'completed',
  },
]

type SortField = 'id' | 'date' | 'customer' | 'route' | 'amount' | 'status'
type SortOrder = 'asc' | 'desc'

type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'

export function BookingManagement() {
  const [bookings, setBookings] = useState(mockBookings)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null)
  const [selectedBookings, setSelectedBookings] = useState<Set<string>>(new Set())

  const itemsPerPage = 10

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.route.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || booking.paymentStatus === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  // Sort bookings
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    let comparison = 0
    switch (sortField) {
      case 'id':
        comparison = a.id.localeCompare(b.id)
        break
      case 'date':
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        break
      case 'customer':
        comparison = a.customerName.localeCompare(b.customerName)
        break
      case 'route':
        comparison = a.route.localeCompare(b.route)
        break
      case 'amount':
        comparison = a.totalAmount - b.totalAmount
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / itemsPerPage)
  const paginatedBookings = sortedBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const handleBookingAction = (bookingId: string, action: 'confirm' | 'cancel' | 'complete') => {
    setBookings(
      bookings.map((b) => {
        if (b.id === bookingId) {
          let newStatus: BookingStatus = b.status
          if (action === 'confirm') newStatus = 'confirmed'
          else if (action === 'cancel') newStatus = 'cancelled'
          else if (action === 'complete') newStatus = 'completed'
          return { ...b, status: newStatus }
        }
        return b
      })
    )
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBookings(new Set(paginatedBookings.map((b) => b.id)))
    } else {
      setSelectedBookings(new Set())
    }
  }

  const handleSelectBooking = (bookingId: string, checked: boolean) => {
    const newSelection = new Set(selectedBookings)
    if (checked) {
      newSelection.add(bookingId)
    } else {
      newSelection.delete(bookingId)
    }
    setSelectedBookings(newSelection)
  }

  const handleExportCSV = () => {
    const headers = ['ID', 'Customer', 'Email', 'Phone', 'Route', 'Date', 'Seats', 'Amount', 'Status', 'Payment']
    const rows = sortedBookings.map((b) => [
      b.id,
      b.customerName,
      b.customerEmail,
      b.customerPhone,
      b.route,
      b.travelDate,
      b.seats.join(', '),
      b.totalAmount.toString(),
      b.status,
      b.paymentStatus,
    ])
    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: BookingStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
    }
    return colors[status]
  }

  const getPaymentColor = (status: PaymentStatus) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    }
    return colors[status]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-500">Manage all bookings and reservations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Booking Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
            <p className="text-xs text-gray-500">Total Bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {bookings.filter((b) => b.status === 'pending').length}
            </p>
            <p className="text-xs text-gray-500">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {bookings.filter((b) => b.status === 'confirmed').length}
            </p>
            <p className="text-xs text-gray-500">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {bookings.filter((b) => b.status === 'cancelled').length}
            </p>
            <p className="text-xs text-gray-500">Cancelled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {bookings.filter((b) => b.status === 'completed').length}
            </p>
            <p className="text-xs text-gray-500">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-gray-100">
              {/* Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedBookings.size === paginatedBookings.length}
                    onCheckedChange={handleSelectAll}
                  />
                </div>
                <div
                  className="col-span-2 cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  onClick={() => handleSort('id')}
                >
                  Booking ID
                  {sortField === 'id' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div
                  className="col-span-2 cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  onClick={() => handleSort('customer')}
                >
                  Customer
                  {sortField === 'customer' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div
                  className="col-span-2 cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  onClick={() => handleSort('route')}
                >
                  Route
                  {sortField === 'route' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div
                  className="col-span-1 cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  onClick={() => handleSort('amount')}
                >
                  Amount
                  {sortField === 'amount' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div className="col-span-2">Status</div>
                <div
                  className="col-span-1 cursor-pointer hover:text-gray-700 flex items-center gap-1"
                  onClick={() => handleSort('date')}
                >
                  Date
                  {sortField === 'date' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Rows */}
              {paginatedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 items-center"
                >
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedBookings.has(booking.id)}
                      onCheckedChange={(checked) =>
                        handleSelectBooking(booking.id, checked as boolean)
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-900">{booking.id}</p>
                    <p className="text-xs text-gray-500">{booking.seats.length} seats</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-medium text-gray-900">{booking.customerName}</p>
                    <p className="text-xs text-gray-500">{booking.customerPhone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-900">{booking.route}</p>
                    <p className="text-xs text-gray-500">{booking.travelDate}</p>
                  </div>
                  <div className="col-span-1 font-medium text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Badge className={getPaymentColor(booking.paymentStatus)} variant="outline">
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                  <div className="col-span-1 text-xs text-gray-500">
                    {new Date(booking.createdAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-1">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleBookingAction(booking.id, 'confirm')}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleBookingAction(booking.id, 'cancel')}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => handleBookingAction(booking.id, 'complete')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of{' '}
          {filteredBookings.length} bookings
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Previous
          </Button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">Booking Details</CardTitle>
                  <p className="text-gray-500">{selectedBooking.id}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status Badges */}
              <div className="flex gap-2">
                <Badge className={getStatusColor(selectedBooking.status)}>
                  {selectedBooking.status}
                </Badge>
                <Badge className={getPaymentColor(selectedBooking.paymentStatus)} variant="outline">
                  Payment: {selectedBooking.paymentStatus}
                </Badge>
              </div>

              {/* Booking Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Travel Date</p>
                    <p className="font-medium">{selectedBooking.travelDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Route</p>
                    <p className="font-medium">{selectedBooking.route}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Departure - Arrival</p>
                    <p className="font-medium">
                      {selectedBooking.departureTime} - {selectedBooking.arrivalTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-50">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-medium">{formatCurrency(selectedBooking.totalAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedBooking.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedBooking.customerEmail}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{selectedBooking.customerPhone}</span>
                  </div>
                </div>
              </div>

              {/* Passengers */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Passengers ({selectedBooking.passengerDetails.length})</h3>
                <div className="space-y-2">
                  {selectedBooking.passengerDetails.map((passenger, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                      <div>
                        <p className="font-medium text-sm">{passenger.name}</p>
                        <p className="text-xs text-gray-500">Seat {selectedBooking.seats[index]}</p>
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        <p>{passenger.email}</p>
                        <p>{passenger.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedBooking.status === 'pending' && (
                  <>
                    <Button
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleBookingAction(selectedBooking.id, 'confirm')
                        setSelectedBooking(null)
                      }}
                    >
                      <Check className="w-4 h-4" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={() => {
                        handleBookingAction(selectedBooking.id, 'cancel')
                        setSelectedBooking(null)
                      }}
                    >
                      <X className="w-4 h-4" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => {
                      handleBookingAction(selectedBooking.id, 'complete')
                      setSelectedBooking(null)
                    }}
                  >
                    <Check className="w-4 h-4" />
                    Mark as Completed
                  </Button>
                )}
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download Receipt
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
