'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

  const validateField = (name: string, value: any) => {
    const fieldErrors: { [key: string]: string } = {}

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!value || value.trim().length < 2) {
          fieldErrors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`
        }
        break
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!value || !emailRegex.test(value)) {
          fieldErrors[name] = 'Please enter a valid email address'
        }
        break
      case 'phone':
        const phoneRegex = /^[6-9]\d{9}$/
        if (!value || !phoneRegex.test(value.replace(/\s/g, ''))) {
          fieldErrors[name] = 'Please enter a valid 10-digit phone number'
        }
        break
      case 'alternatePhone':
        if (value && !/^[6-9]\d{9}$/.test(value.replace(/\s/g, ''))) {
          fieldErrors[name] = 'Please enter a valid 10-digit phone number'
        }
        break
      case 'address':
        if (!value || value.trim().length < 10) {
          fieldErrors[name] = 'Address must be at least 10 characters'
        }
        break
      case 'city':
      case 'state':
        if (!value || value.trim().length < 2) {
          fieldErrors[name] = `${name === 'city' ? 'City' : 'State'} is required`
        }
        break
      case 'pincode':
        const pincodeRegex = /^\d{6}$/
        if (!value || !pincodeRegex.test(value)) {
          fieldErrors[name] = 'Please enter a valid 6-digit pincode'
        }
        break
      case 'acceptTerms':
        if (!value) {
          fieldErrors[name] = 'You must accept the terms and conditions'
        }
        break
    }

    return fieldErrors
  }

  const handleChange = (name: keyof CustomerInfo, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    setTouched(prev => ({ ...prev, [name]: true }))

    const fieldErrors = validateField(name, value)
    setErrors(prev => ({ ...prev, ...fieldErrors }))
  }

  const handleBlur = (name: keyof CustomerInfo) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    const fieldErrors = validateField(name, formData[name])
    setErrors(prev => ({ ...prev, ...fieldErrors }))
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    Object.keys(formData).forEach(key => {
      const fieldErrors = validateField(key, formData[key as keyof CustomerInfo])
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
    return formData.firstName.length >= 2 &&
           formData.lastName.length >= 2 &&
           /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
           /^[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, '')) &&
           formData.address.length >= 10 &&
           formData.city.length >= 2 &&
           formData.state.length >= 2 &&
           /^\d{6}$/.test(formData.pincode) &&
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
              Email Address <span className="text-destructive">*</span>
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
              <select
                id="state"
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                onBlur={() => handleBlur('state')}
                className={cn(
                  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                  errors.state && touched.state && 'border-destructive'
                )}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
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
              onChange={(e) => handleChange('specialRequests', e.target.value)}
              placeholder="Any special requests or additional information..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.specialRequests.length}/500
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
