// Simple validation utilities

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationSchema {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  valid: boolean
  errors: { [key: string]: string }
}

export function validate(schema: ValidationSchema, data: any): ValidationResult {
  const errors: { [key: string]: string } = {}

  for (const field in schema) {
    const rules = schema[field]
    const value = data[field]

    // Required validation
    if (rules.required && (!value || value === '')) {
      errors[field] = `${field} is required`
      continue
    }

    if (value) {
      // Min length validation
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${field} must be at least ${rules.minLength} characters`
        continue
      }

      // Max length validation
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${field} must not exceed ${rules.maxLength} characters`
        continue
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errors[field] = `${field} format is invalid`
        continue
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value)
        if (result === true) {
          // Valid
        } else if (typeof result === 'string') {
          errors[field] = result
        } else {
          errors[field] = `${field} is invalid`
        }
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  pincode: /^\d{6}$/,
  cardNumber: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
  expiry: /^(0[1-9]|1[0-2])\/\d{2}$/,
  cvv: /^\d{3,4}$/
}

// Trip details validation schema
export const tripDetailsSchema: ValidationSchema = {
  pickupLocation: { required: true },
  dropLocation: { required: true },
  pickupDate: { required: true },
  pickupTime: { required: true },
  returnDate: { custom: (value: string, data: any) => {
    if (data.tripType === 'round-trip' && !value) {
      return 'Return date is required for round-trip'
    }
    return true
  }},
  returnTime: { custom: (value: string, data: any) => {
    if (data.tripType === 'round-trip' && !value) {
      return 'Return time is required for round-trip'
    }
    return true
  }},
  passengerCount: { required: true, custom: (value: number) => {
    if (value < 1) return 'At least 1 passenger is required'
    if (value > 50) return 'Maximum 50 passengers allowed'
    return true
  }}
}

// Customer details validation schema
export const customerDetailsSchema: ValidationSchema = {
  firstName: { required: true, minLength: 2, maxLength: 50 },
  lastName: { required: true, minLength: 2, maxLength: 50 },
  email: { required: true, pattern: patterns.email },
  phone: { required: true, pattern: patterns.phone },
  alternatePhone: { pattern: patterns.phone },
  address: { required: true, minLength: 10, maxLength: 200 },
  city: { required: true, minLength: 2, maxLength: 50 },
  state: { required: true, minLength: 2, maxLength: 50 },
  pincode: { required: true, pattern: patterns.pincode },
  acceptTerms: { required: true, custom: (value: boolean) => {
    if (!value) return 'You must accept the terms and conditions'
    return true
  }}
}

// Payment validation schema
export const paymentSchema: ValidationSchema = {
  method: { required: true },
  cardDetails: { custom: (value: any, data: any) => {
    if (data.method === 'card' && !value) {
      return 'Card details are required'
    }
    return true
  }},
  upiId: { custom: (value: string, data: any) => {
    if (data.method === 'upi' && !value) {
      return 'UPI ID is required'
    }
    return true
  }}
}
