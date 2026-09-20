'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CustomerInfo } from '@/types/booking'

interface CustomerDetailsProps {
  onNext: (data: CustomerInfo) => void
  onBack: () => void
  passengerCount: number
  initialData?: CustomerInfo
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
]

export function CustomerDetails({ onNext, onBack, passengerCount, initialData }: CustomerDetailsProps) {
  const [formData, setFormData] = useState<CustomerInfo>(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      specialRequests: '',
      acceptTerms: false
    }
  )

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})

  // Reset form state when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setErrors({})
      setTouched({})
    }
  }, [initialData])

  const validateField = (name: string, value: any, isBlur: boolean = false) => {
    const fieldErrors: { [key: string]: string } = {}

    switch (name) {
      case 'firstName':
      case 'lastName':
        // Only show error if value exists and is too short, or if blurring with empty/short value
        const trimmed = value?.trim() || ''
        if (trimmed.length > 0 && trimmed.length < 2) {
          fieldErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`
        } else if (isBlur && trimmed.length < 2) {
          fieldErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`
        }
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        const trimmedEmail = value?.trim() || ''
        // Only validate email if user has typed something substantial
        // For "while typing" (not blur): only validate if they've typed @ and some more, and it's invalid
        // For blur: validate if anything is typed and it's invalid
        if (!isBlur && trimmedEmail.includes('@') && trimmedEmail.length > 5 && !emailRegex.test(trimmedEmail)) {
          fieldErrors[name] = 'Please enter a valid email address'
        } else if (isBlur && trimmedEmail.length > 0 && !emailRegex.test(trimmedEmail)) {
          fieldErrors[name] = 'Please enter a valid email address'
        }
        break
      case 'phone':
        const phoneRegex = /^[6-9]\d{9}$/
        const cleanPhone = String(value || '').replace(/[^\d]/g, '')
        // Only validate phone if user has entered at least some digits
        if (cleanPhone.length > 0 && cleanPhone.length < 10 && !isBlur) {
          // Don't show error while typing, unless it's clearly invalid (doesn't start with 6-9)
          if (cleanPhone.length > 0 && !/^[6-9]/.test(cleanPhone)) {
            fieldErrors[name] = 'Phone number must start with 6, 7, 8, or 9'
          }
        } else if (cleanPhone.length > 0 && !phoneRegex.test(cleanPhone)) {
          fieldErrors[name] = 'Please enter a valid 10-digit phone number'
        } else if (isBlur && cleanPhone.length === 0) {
          fieldErrors[name] = 'Phone number is required'
        }
        break
      case 'alternatePhone':
        const cleanAltPhone = String(value || '').replace(/[^\d]/g, '')
        if (cleanAltPhone.length > 0 && cleanAltPhone.length < 10) {
          // Only show error if they've started typing but it's incomplete
          if (cleanAltPhone.length > 0 && !/^[6-9]/.test(cleanAltPhone)) {
            fieldErrors[name] = 'Phone number must start with 6, 7, 8, or 9'
          }
        } else if (cleanAltPhone.length > 0 && !/^[6-9]\d{9}$/.test(cleanAltPhone)) {
          fieldErrors[name] = 'Please enter a valid 10-digit phone number'
        }
        break
      case 'address':
        const trimmedAddress = value?.trim() || ''
        if (trimmedAddress.length > 0 && trimmedAddress.length < 10) {
          fieldErrors[name] = 'Address must be at least 10 characters'
        } else if (isBlur && trimmedAddress.length < 10) {
          fieldErrors[name] = 'Address is required (min 10 characters)'
        }
        break
      case 'city':
      case 'state':
        const trimmedValue = value?.trim() || ''
        if (trimmedValue.length > 0 && trimmedValue.length < 2) {
          fieldErrors[name] = `${name === 'city' ? 'City' : 'State'} must be at least 2 characters`
        } else if (isBlur && trimmedValue.length < 2) {
          fieldErrors[name] = `${name === 'city' ? 'City' : 'State'} is required`
        }
        break
      case 'pincode':
        const trimmedPincode = String(value || '').trim()
        if (trimmedPincode.length > 0 && trimmedPincode.length < 6) {
          // Don't show error while typing
        } else if (trimmedPincode.length > 0 && !/^\d{6}$/.test(trimmedPincode)) {
          fieldErrors[name] = 'Please enter a valid 6-digit pincode'
        } else if (isBlur && trimmedPincode.length === 0) {
          fieldErrors[name] = 'Pincode is required'
        }
        break
      case 'acceptTerms':
        // Only show error on blur if not checked
        if (isBlur && !value) {
          fieldErrors[name] = 'You must accept the terms and conditions'
        }
        break
    }

    return fieldErrors
  }

  const handleChange = (name: keyof CustomerInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    // Validate on change without blur flag (more lenient while typing)
    const fieldErrors = validateField(name, value, false)

    // Properly handle error clearing - remove error if field is now valid
    setErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(fieldErrors).length === 0) {
        // No errors for this field, remove the error key
        delete newErrors[name]
      } else {
        // Has errors, add/update them
        newErrors[name] = fieldErrors[name]
      }
      return newErrors
    })
  }

  const handleBlur = (name: keyof CustomerInfo) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    // Validate with blur flag (stricter validation)
    const fieldErrors = validateField(name, formData[name], true)

    // Properly handle error clearing
    setErrors(prev => {
      const newErrors = { ...prev }
      if (Object.keys(fieldErrors).length === 0) {
        // No errors for this field, remove the error key
        delete newErrors[name]
      } else {
        // Has errors, add/update them
        newErrors[name] = fieldErrors[name]
      }
      return newErrors
    })
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    Object.keys(formData).forEach(key => {
      // Use isBlur=true for strict validation on form submit
      const fieldErrors = validateField(key, formData[key as keyof CustomerInfo], true)
      Object.assign(newErrors, fieldErrors)
    })

    setErrors(newErrors)
    setTouched(
      Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    )

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onNext(formData)
    }
  }

  const isFormValid = () => {
    // Use trimmed values consistent with validateField
    const firstName = formData.firstName.trim()
    const lastName = formData.lastName.trim()
    const email = formData.email.trim()
    const phone = formData.phone.replace(/[^\d]/g, '')
    const address = formData.address.trim()
    const city = formData.city.trim()
    const state = formData.state.trim()
    const pincode = formData.pincode.trim()
    const alternatePhone = formData.alternatePhone?.replace(/[^\d]/g, '') || ''

    // Email is now optional - only validate if provided
    const isEmailValid = email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

    return firstName.length >= 2 &&
           lastName.length >= 2 &&
           isEmailValid &&
           /^[6-9]\d{9}$/.test(phone) &&
           address.length >= 10 &&
           city.length >= 2 &&
           state.length >= 2 &&
           /^\d{6}$/.test(pincode) &&
           (!alternatePhone || /^[6-9]\d{9}$/.test(alternatePhone)) &&
           formData.acceptTerms
  }

  return (
    <div className="space-y-6">
      {/* Passenger Count Reminder */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">Booking for {passengerCount} passenger{passengerCount > 1 ? 's' : ''}</p>
                <p className="text-sm text-muted-foreground">
                  Please provide primary contact details
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Your phone number is used for booking confirmation and updates. No password required.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                onBlur={() => handleBlur('firstName')}
                placeholder="Enter first name"
                className={cn(errors.firstName && touched.firstName && 'border-destructive')}
              />
              {errors.firstName && touched.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                onBlur={() => handleBlur('lastName')}
                placeholder="Enter last name"
                className={cn(errors.lastName && touched.lastName && 'border-destructive')}
              />
              {errors.lastName && touched.lastName && (
                <p className="text-sm text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="your.email@example.com"
              className={cn(errors.email && touched.email && 'border-destructive')}
            />
            {errors.email && touched.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            <p className="text-xs text-muted-foreground">Booking confirmation will be sent via SMS</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                onBlur={() => handleBlur('phone')}
                placeholder="9876543210"
                className={cn(errors.phone && touched.phone && 'border-destructive')}
              />
              {errors.phone && touched.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="alternatePhone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Alternate Phone <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="alternatePhone"
                type="tel"
                value={formData.alternatePhone}
                onChange={(e) => handleChange('alternatePhone', e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                onBlur={() => handleBlur('alternatePhone')}
                placeholder="Alternate number"
                className={cn(errors.alternatePhone && touched.alternatePhone && 'border-destructive')}
              />
              {errors.alternatePhone && touched.alternatePhone && (
                <p className="text-sm text-destructive">{errors.alternatePhone}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Address Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address" className="flex items-center gap-2">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              onBlur={() => handleBlur('address')}
              placeholder="Enter your complete address"
              rows={3}
              className={cn(errors.address && touched.address && 'border-destructive')}
            />
            {errors.address && touched.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                onBlur={() => handleBlur('city')}
                placeholder="Enter city"
                className={cn(errors.city && touched.city && 'border-destructive')}
              />
              {errors.city && touched.city && (
                <p className="text-sm text-destructive">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State <span className="text-destructive">*</span></Label>
              <Select
                value={formData.state}
                onValueChange={(value) => handleChange('state', value)}
              >
                <SelectTrigger
                  id="state"
                  className={cn(errors.state && touched.state && 'border-destructive')}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && touched.state && (
                <p className="text-sm text-destructive">{errors.state}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
              <Input
                id="pincode"
                type="text"
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value.replace(/[^\d]/g, '').slice(0, 6))}
                onBlur={() => handleBlur('pincode')}
                placeholder="600001"
                className={cn(errors.pincode && touched.pincode && 'border-destructive')}
              />
              {errors.pincode && touched.pincode && (
                <p className="text-sm text-destructive">{errors.pincode}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests <span className="text-muted-foreground">(Optional)</span></Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => {
                const value = e.target.value.slice(0, 500)
                handleChange('specialRequests', value)
              }}
              onBlur={() => handleBlur('specialRequests')}
              placeholder="Any special requests or additional information..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.specialRequests?.length || 0}/500
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={formData.acceptTerms}
              onCheckedChange={(checked) => handleChange('acceptTerms', checked as boolean)}
              className={cn(errors.acceptTerms && touched.acceptTerms && 'border-destructive')}
            />
            <div className="flex-1 space-y-1">
              <Label htmlFor="terms" className="cursor-pointer font-medium">
                I accept the Terms and Conditions <span className="text-destructive">*</span>
              </Label>
              <p className="text-sm text-muted-foreground">
                By proceeding, you agree to our booking policies, cancellation terms, and privacy policy.
              </p>
            </div>
          </div>
          {errors.acceptTerms && touched.acceptTerms && (
            <p className="text-sm text-destructive mt-2">{errors.acceptTerms}</p>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className="flex-1"
        >
          Review & Pay
        </Button>
      </div>
    </div>
  )
}
