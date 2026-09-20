'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ToggleLeft,
  ToggleRight,
  Wrench,
  Image as ImageIcon,
  Download,
  Upload
} from 'lucide-react'
import { Vehicle, VehicleType } from '@/types'
import { vehicleApi } from '@/lib/api'

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'traveller', label: 'Traveller Van' },
  { value: 'coach', label: 'Coach' },
  { value: 'bus', label: 'Bus' },
]

type ViewMode = 'list' | 'details'

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Load vehicles from API
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true)
        const response = await vehicleApi.getVehicles()

        // Transform API response to match Vehicle type
        const vehiclesData = response.data.map((v: any) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          make: v.make,
          model: v.model,
          year: v.year,
          seatingCapacity: v.seatingCapacity,
          amenities: v.amenities || [],
          imageUrl: v.thumbnailImage || v.images?.[0] || '/images/placeholder-vehicle.jpg',
          images: v.images || [],
          rating: v.rating || 4.5,
          reviewCount: v.reviewCount || 0,
          basePrice: v.pricePerKm,
          priceUnit: 'per-km',
          minCharge: v.minimumCharge,
          driverCharges: v.driverAllowancePerDay,
          features: v.features ? JSON.parse(v.features || '{}').features || [] : [],
          description: v.description || '',
          specifications: v.specifications || {},
          available: v.isAvailable !== false,
        }))

        setVehicles(vehiclesData)
      } catch (err) {
        console.error('Failed to load vehicles:', err)
        setError('Failed to load vehicles. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadVehicles()
  }, [])

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = selectedType === 'all' || vehicle.type === selectedType
    const matchesStatus = selectedStatus === 'all' ||
      (selectedStatus === 'active' && vehicle.available) ||
      (selectedStatus === 'inactive' && !vehicle.available)

    return matchesSearch && matchesType && matchesStatus
  })

  // Bulk actions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVehicles(new Set(filteredVehicles.map((v) => v.id)))
    } else {
      setSelectedVehicles(new Set())
    }
  }

  const handleSelectVehicle = (vehicleId: string, checked: boolean) => {
    const newSelection = new Set(selectedVehicles)
    if (checked) {
      newSelection.add(vehicleId)
    } else {
      newSelection.delete(vehicleId)
    }
    setSelectedVehicles(newSelection)
  }

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    try {
      // For each selected vehicle, perform the action
      for (const vehicleId of selectedVehicles) {
        if (action === 'delete') {
          // Delete operation would go here - for now just remove from local state
          console.log('Delete vehicle:', vehicleId)
        } else {
          // Update vehicle availability
          console.log('Update vehicle availability:', vehicleId, action === 'activate')
        }
      }

      // Update local state
      if (action === 'delete') {
        setVehicles(vehicles.filter((v) => !selectedVehicles.has(v.id)))
      } else {
        setVehicles(
          vehicles.map((v) =>
            selectedVehicles.has(v.id)
              ? { ...v, available: action === 'activate' }
              : v
          )
        )
      }
      setSelectedVehicles(new Set())
    } catch (err) {
      console.error('Failed to perform bulk action:', err)
      alert('Failed to perform action. Please try again.')
    }
  }

  const handleToggleStatus = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (!vehicle) return

      // Update API - placeholder for now
      console.log('Toggle vehicle availability:', vehicleId, !vehicle.available)

      // Update local state
      setVehicles(
        vehicles.map((v) =>
          v.id === vehicleId ? { ...v, available: !v.available } : v
        )
      )
    } catch (err) {
      console.error('Failed to toggle vehicle status:', err)
      alert('Failed to update vehicle status. Please try again.')
    }
  }

  const getVehicleTypeColor = (type: VehicleType) => {
    const colors = {
      car: 'bg-blue-100 text-blue-700',
      traveller: 'bg-green-100 text-green-700',
      coach: 'bg-purple-100 text-purple-700',
      bus: 'bg-orange-100 text-orange-700',
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Vehicle Management</h2>
          <p className="text-gray-500">Manage your fleet and availability</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {vehicleTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedVehicles.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-700">
                {selectedVehicles.size} vehicle{selectedVehicles.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                >
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('deactivate')}
                >
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleBulkAction('delete')}
                >
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Vehicles ({filteredVehicles.length})</CardTitle>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading vehicles...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center text-red-600">
                <p>{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          ) : filteredVehicles.length === 0 ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center text-gray-500">
                <p>No vehicles found</p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-gray-100">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedVehicles.size === filteredVehicles.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-4">Vehicle</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Capacity</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-1"></div>
                </div>

                {/* Rows */}
                {filteredVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 items-center"
                >
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedVehicles.has(vehicle.id)}
                      onCheckedChange={(checked) =>
                        handleSelectVehicle(vehicle.id, checked as boolean)
                      }
                    />
                  </div>
                  <div className="col-span-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={vehicle.imageUrl}
                        alt={vehicle.name}
                        className="w-16 h-12 rounded object-cover"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{vehicle.name}</p>
                        <p className="text-sm text-gray-500">
                          {vehicle.make} {vehicle.model}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge className={getVehicleTypeColor(vehicle.type)}>
                      {vehicle.type}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm text-gray-600">
                    {vehicle.seatingCapacity} seats
                  </div>
                  <div className="col-span-2">
                    <Badge
                      variant={vehicle.available ? 'default' : 'secondary'}
                      className={
                        vehicle.available
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700'
                      }
                    >
                      {vehicle.available ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(vehicle.id)}
                      >
                        {vehicle.available ? (
                          <ToggleRight className="w-5 h-5 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedVehicle(vehicle)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedVehicle.name}</CardTitle>
                  <p className="text-gray-500">
                    {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVehicle(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <img
                src={selectedVehicle.imageUrl}
                alt={selectedVehicle.name}
                className="w-full h-48 object-cover rounded-lg"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Seating Capacity</p>
                  <p className="font-medium">{selectedVehicle.seatingCapacity} seats</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="font-medium">
                    Rs. {selectedVehicle.basePrice} / {selectedVehicle.priceUnit}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rating</p>
                  <p className="font-medium">
                    {selectedVehicle.rating} ({selectedVehicle.reviewCount} reviews)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={selectedVehicle.available ? 'default' : 'secondary'}
                    className={
                      selectedVehicle.available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {selectedVehicle.available ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Description</p>
                <p className="text-gray-600">{selectedVehicle.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Amenities</p>
                <div className="flex flex-wrap gap-2">
                  {selectedVehicle.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Maintenance Schedule</p>
                <p className="text-sm text-gray-500">No maintenance schedule</p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button className="flex-1 gap-2">
                  <Edit className="w-4 h-4" />
                  Edit Vehicle
                </Button>
                <Button variant="outline" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Update Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
