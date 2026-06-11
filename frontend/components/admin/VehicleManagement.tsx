'use client'

import { useState } from 'react'
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

// Mock data
const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Volvo 9400XL',
    type: 'bus',
    make: 'Volvo',
    model: '9400XL',
    year: 2022,
    seatingCapacity: 45,
    amenities: ['ac', 'wifi', 'charging-point', 'tv', 'water-bottle'],
    imageUrl: 'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=400',
    images: [],
    rating: 4.5,
    reviewCount: 128,
    basePrice: 2500,
    priceUnit: 'per-day',
    minCharge: 5000,
    driverCharges: 1500,
    features: ['Pushback seats', 'Reading lights', 'USB charging'],
    description: 'Luxury multi-axle Volvo coach with premium amenities',
    specifications: {
      engine: 'D13C',
      fuelType: 'diesel',
      transmission: 'automatic',
      mileage: '4 kmpl',
      length: '12m',
      width: '2.6m',
      height: '3.8m',
      luggageCapacity: '150 cubic feet',
    },
    available: true,
  },
  {
    id: '2',
    name: 'Scania Metrolink',
    type: 'bus',
    make: 'Scania',
    model: 'Metrolink',
    year: 2023,
    seatingCapacity: 36,
    amenities: ['ac', 'wifi', 'charging-point', 'toilet', 'blanket'],
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400',
    images: [],
    rating: 4.8,
    reviewCount: 92,
    basePrice: 2800,
    priceUnit: 'per-day',
    minCharge: 6000,
    driverCharges: 1500,
    features: ['Recliner seats', 'Personal TV', 'Ambient lighting'],
    description: 'Premium business class coach with executive features',
    specifications: {
      engine: 'DC13',
      fuelType: 'diesel',
      transmission: 'automatic',
      mileage: '5 kmpl',
      length: '11m',
      width: '2.5m',
      height: '3.6m',
      luggageCapacity: '120 cubic feet',
    },
    available: true,
  },
  {
    id: '3',
    name: 'Toyota Coaster',
    type: 'coach',
    make: 'Toyota',
    model: 'Coaster',
    year: 2021,
    seatingCapacity: 22,
    amenities: ['ac', 'music-system'],
    imageUrl: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?w=400',
    images: [],
    rating: 4.2,
    reviewCount: 45,
    basePrice: 1800,
    priceUnit: 'per-day',
    minCharge: 3000,
    driverCharges: 1000,
    features: ['Comfortable seating', 'Good suspension'],
    description: 'Reliable mini-coach for small groups',
    specifications: {
      engine: '4.5L Turbo',
      fuelType: 'diesel',
      transmission: 'manual',
      mileage: '8 kmpl',
      luggageCapacity: '60 cubic feet',
    },
    available: false,
  },
  {
    id: '4',
    name: 'Force Traveller',
    type: 'traveller',
    make: 'Force',
    model: 'Traveller 3350',
    year: 2022,
    seatingCapacity: 12,
    amenities: ['ac'],
    imageUrl: 'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=400',
    images: [],
    rating: 4.0,
    reviewCount: 32,
    basePrice: 1200,
    priceUnit: 'per-day',
    minCharge: 2000,
    driverCharges: 800,
    features: ['Spacious', 'Good AC'],
    description: 'Perfect van for small group tours',
    specifications: {
      engine: '2.6L',
      fuelType: 'diesel',
      transmission: 'manual',
      mileage: '10 kmpl',
      luggageCapacity: '30 cubic feet',
    },
    available: true,
  },
]

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'car', label: 'Car' },
  { value: 'traveller', label: 'Traveller Van' },
  { value: 'coach', label: 'Coach' },
  { value: 'bus', label: 'Bus' },
]

const maintenanceSchedules = [
  { vehicleId: '1', nextService: '2024-02-15', status: 'due' },
  { vehicleId: '2', nextService: '2024-03-20', status: 'upcoming' },
  { vehicleId: '3', nextService: '2024-01-28', status: 'overdue' },
  { vehicleId: '4', nextService: '2024-02-28', status: 'upcoming' },
]

type ViewMode = 'list' | 'details'

export function VehicleManagement() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedVehicles, setSelectedVehicles] = useState<Set<string>>(new Set())
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

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

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
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
  }

  const handleToggleStatus = (vehicleId: string) => {
    setVehicles(
      vehicles.map((v) =>
        v.id === vehicleId ? { ...v, available: !v.available } : v
      )
    )
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
                {(() => {
                  const schedule = maintenanceSchedules.find(
                    (s) => s.vehicleId === selectedVehicle.id
                  )
                  return schedule ? (
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">
                        Next service: <span className="font-medium">{schedule.nextService}</span>
                      </span>
                      <Badge
                        variant={
                          schedule.status === 'overdue'
                            ? 'destructive'
                            : schedule.status === 'due'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {schedule.status}
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No maintenance schedule</p>
                  )
                })()}
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
