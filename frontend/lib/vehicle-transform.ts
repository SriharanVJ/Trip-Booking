import type { Vehicle, VehicleAmenity } from '@/types'

/**
 * Transform amenities from backend format (AC, WIFI) to frontend format (ac, wifi)
 */
export function transformAmenities(apiAmenities: string[]): VehicleAmenity[] {
  const amenityMap: Record<string, VehicleAmenity> = {
    'AC': 'ac',
    'WIFI': 'wifi',
    'USB_CHARGING': 'charging-point',
    'TV': 'tv',
    'TOILET': 'toilet',
    'WATER_BOTTLE': 'water-bottle',
    'WATER_BOTTLES': 'water-bottle',
    'BLANKET': 'blanket',
    'BLANKETS': 'blanket',
    'PILLOWS': 'blanket',
    'MEAL': 'meal',
    'SNACKS': 'meal',
    'MUSIC_SYSTEM': 'music-system',
    'FIRST_AID_KIT': 'first-aid-kit',
    'FIRE_EXTINGUISHER': 'fire-extinguisher',
    'GPS': 'gps',
    'REAR_CAMERA': 'rear-camera',
    'PUSHBACK_SEAT': 'pushback-seat',
    'PUSHBACK_SEATS': 'pushback-seat',
    'RECLINING_SEAT': 'reclining-seat',
    'RECLINING_SEATS': 'reclining-seats',
    'READING_LIGHTS': 'reading-light',
    'READING_LIGHT': 'reading-light',
    'LUGGAGE_SPACE': 'luggage-space',
    'PASSENGER_DISPLAY': 'passenger-display',
    'ENTERTAINMENT_SYSTEM': 'entertainment-system',
    'MICROPHONE': 'microphone',
    'REFRIGERATOR': 'refrigerator',
  }
  return apiAmenities.map(a => amenityMap[a] || a.toLowerCase().replace(/_/g, '-').replace(/ /g, '-') as VehicleAmenity)
}

/**
 * Transform vehicle type from backend format to frontend format
 */
export function transformVehicleType(apiType: string): Vehicle['type'] {
  if (apiType.includes('CAR') || apiType.includes('SEATER')) return 'car'
  if (apiType.includes('TRAVELLER') || apiType.includes('TEMP')) return 'traveller'
  if (apiType.includes('COACH')) return 'coach'
  if (apiType.includes('BUS')) return 'bus'
  return 'car' // default
}

/**
 * Transform API vehicle response to frontend Vehicle type
 */
export function transformApiVehicle(apiVehicle: any): Vehicle {
  return {
    id: apiVehicle.id,
    name: apiVehicle.name,
    type: transformVehicleType(apiVehicle.type),
    make: apiVehicle.make || '',
    model: apiVehicle.model || '',
    year: apiVehicle.year || new Date().getFullYear(),
    seatingCapacity: apiVehicle.seatingCapacity || 5,
    amenities: transformAmenities(apiVehicle.amenities || []),
    imageUrl: apiVehicle.thumbnailImage || apiVehicle.images?.[0] || '/images/placeholder-vehicle.jpg',
    images: apiVehicle.images || [],
    rating: apiVehicle.rating || 4.5,
    reviewCount: apiVehicle.reviewCount || 0,
    basePrice: apiVehicle.pricePerKm || 15,
    priceUnit: 'per-km' as const,
    minCharge: apiVehicle.minimumCharge || 250,
    driverCharges: apiVehicle.driverAllowancePerDay || 500,
    features: apiVehicle.features?.features || [],
    description: apiVehicle.description || '',
    specifications: apiVehicle.specifications || {},
    available: apiVehicle.isAvailable !== false,
    fuelType: apiVehicle.fuelType || 'DIESEL',
    pricePerDay: apiVehicle.pricePerDay || apiVehicle.pricePerKm * 200,
  }
}

/**
 * Transform multiple API vehicles to frontend Vehicle types
 */
export function transformApiVehicles(apiVehicles: any[]): Vehicle[] {
  return apiVehicles.map(transformApiVehicle)
}
