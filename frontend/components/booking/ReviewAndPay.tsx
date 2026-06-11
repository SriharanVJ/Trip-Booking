'use client'

import { useState } from 'react'
import { CreditCard, IndianRupee, Smartphone, Building2, Truck, Clock, MapPin, Users, CheckCircle2, AlertCircle, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatCurrency } from '@/lib/utils'
import type { PaymentMethod, PriceBreakdown, DiscountCode } from '@/types/booking'
import type { Vehicle } from '@/types'
import type { TripDetails, CustomerInfo } from '@/types/booking'

interface ReviewAndPayProps {
  vehicle: Vehicle
  trip: TripDetails
  customer: CustomerInfo
  onBack: () => void
  onSubmit: (paymentData: any) => void
}

// Sample discount codes
const DISCOUNT_CODES: Record<string, DiscountCode> = {
  'FIRST10': { code: 'FIRST10', amount: 10, type: 'percentage', description: 'First booking discount' },
  'FLAT500': { code: 'FLAT500', amount: 500, type: 'fixed', description: 'Flat ₹500 off' },
  'SUMMER20': { code: 'SUMMER20', amount: 20, type: 'percentage', description: 'Summer special offer' }
}

export function ReviewAndPay({ vehicle, trip, customer, onBack, onSubmit }: ReviewAndPayProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [discountCode, setDiscountCode] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [upiId, setUpiId] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  // Calculate price breakdown
  const calculatePriceBreakdown = (): PriceBreakdown => {
    const distance = trip.estimatedDistance || 0
    const duration = trip.estimatedDuration || 0
    const days = trip.tripType === 'round-trip' ? 2 : 1

    const baseFare = distance * vehicle.basePrice
    const driverCharges = days * vehicle.driverCharges
    const tollCharges = Math.round(distance * 0.02) // Estimate 2% of distance as toll
    const subtotal = baseFare + driverCharges + tollCharges
    const tax = Math.round(subtotal * 0.05) // 5% tax

    let discount = 0
    if (appliedDiscount) {
      discount = appliedDiscount.type === 'percentage'
        ? Math.round(subtotal * appliedDiscount.amount / 100)
        : appliedDiscount.amount
    }

    const total = subtotal + tax - discount

    return {
      baseFare,
      driverCharges,
      tollCharges,
      tax,
      discount,
      total
    }
  }

  const priceBreakdown = calculatePriceBreakdown()

  const handleApplyDiscount = () => {
    const discount = DISCOUNT_CODES[discountCode.toUpperCase()]
    if (discount) {
      setAppliedDiscount(discount)
    } else {
      setAppliedDiscount(null)
    }
  }

  const handleRemoveDiscount = () => {
    setDiscountCode('')
    setAppliedDiscount(null)
  }

  const handleSubmit = async () => {
    if (!acceptTerms) return

    setIsProcessingPayment(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const paymentData = {
      method: paymentMethod,
      cardDetails: paymentMethod === 'card' ? cardDetails : undefined,
      upiId: paymentMethod === 'upi' ? upiId : undefined,
      amount: priceBreakdown.total,
      discount: appliedDiscount
    }

    setIsProcessingPayment(false)
    onSubmit(paymentData)
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Vehicle Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-20 w-24 rounded-lg overflow-hidden bg-muted">
              <img src={vehicle.imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{vehicle.name}</h3>
              <p className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{vehicle.type}</Badge>
                <Badge variant="outline">{vehicle.seatingCapacity} seats</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('trip')}>
            <span className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Details
            </span>
            {expandedSection === 'trip' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        <CardContent className={expandedSection === 'trip' ? '' : 'hidden'}>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <div className="w-0.5 h-12 bg-border" />
                <div className="h-3 w-3 rounded-full bg-destructive" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">From</p>
                  <p className="font-medium">{trip.pickupLocation?.name}, {trip.pickupLocation?.city}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">To</p>
                  <p className="font-medium">{trip.dropLocation?.name}, {trip.dropLocation?.city}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Date</p>
                  <p className="font-medium">{formatDate(trip.pickupDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup Time</p>
                  <p className="font-medium">{trip.pickupTime}</p>
                </div>
              </div>
            </div>

            {trip.tripType === 'round-trip' && trip.returnDate && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Return Date</p>
                      <p className="font-medium">{formatDate(trip.returnDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Return Time</p>
                      <p className="font-medium">{trip.returnTime}</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">Passengers</span>
              </div>
              <Badge variant="secondary">{trip.passengerCount}</Badge>
            </div>

            {trip.estimatedDistance && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Estimated Distance</span>
                </div>
                <Badge variant="secondary">{trip.estimatedDistance} km</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('customer')}>
            <span className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Details
            </span>
            {expandedSection === 'customer' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        <CardContent className={expandedSection === 'customer' ? '' : 'hidden'}>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{customer.firstName} {customer.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{customer.phone}</p>
            </div>
            {customer.alternatePhone && (
              <div>
                <p className="text-sm text-muted-foreground">Alternate Phone</p>
                <p className="font-medium">{customer.alternatePhone}</p>
              </div>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-sm">{customer.address}</p>
              <p className="text-sm">{customer.city}, {customer.state} - {customer.pincode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Price Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Fare ({trip.estimatedDistance || 0} km × {formatCurrency(vehicle.basePrice)}/km)</span>
              <span>{formatCurrency(priceBreakdown.baseFare)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Driver Charges</span>
              <span>{formatCurrency(priceBreakdown.driverCharges)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Toll & Taxes (Estimated)</span>
              <span>{formatCurrency(priceBreakdown.tollCharges)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (5%)</span>
              <span>{formatCurrency(priceBreakdown.tax)}</span>
            </div>

            {appliedDiscount && (
              <>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span>-{formatCurrency(priceBreakdown.discount)}</span>
                </div>
              </>
            )}

            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(priceBreakdown.total)}</span>
            </div>
          </div>

          {/* Discount Code */}
          <div className="flex gap-2 pt-4">
            <Input
              placeholder="Enter discount code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              disabled={!!appliedDiscount}
            />
            {appliedDiscount ? (
              <Button variant="outline" onClick={handleRemoveDiscount}>
                Remove
              </Button>
            ) : (
              <Button variant="outline" onClick={handleApplyDiscount}>
                Apply
              </Button>
            )}
          </div>

          {appliedDiscount && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
              <CheckCircle2 className="h-4 w-4" />
              <span>{appliedDiscount.description} applied successfully!</span>
            </div>
          )}

          {discountCode && !appliedDiscount && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded">
              <AlertCircle className="h-4 w-4" />
              <span>Invalid discount code</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  paymentMethod === 'cash' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('cash')}
              >
                <IndianRupee className="h-6 w-6" />
                <span className="font-medium">Cash</span>
              </div>

              <div
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="h-6 w-6" />
                <span className="font-medium">Card</span>
              </div>

              <div
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('upi')}
              >
                <Smartphone className="h-6 w-6" />
                <span className="font-medium">UPI</span>
              </div>

              <div
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  paymentMethod === 'bank-transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('bank-transfer')}
              >
                <Building2 className="h-6 w-6" />
                <span className="font-medium">Bank Transfer</span>
              </div>
            </div>
          </RadioGroup>

          {/* Card Details */}
          {paymentMethod === 'card' && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    placeholder="MM/YY"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))}
                    maxLength={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="password"
                    placeholder="•••"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))}
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName">Name on Card</Label>
                <Input
                  id="cardName"
                  placeholder="Enter name"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* UPI Details */}
          {paymentMethod === 'upi' && (
            <div className="space-y-3 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="upiId">UPI ID</Label>
                <Input
                  id="upiId"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your UPI ID (e.g., name@upi, mobilenumber@upi)
                </p>
              </div>
            </div>
          )}

          {/* Secure Payment Badge */}
          <div className="flex items-center gap-2 pt-4 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure payment powered by SSL encryption</span>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Submit */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="paymentTerms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <div className="flex-1">
                <Label htmlFor="paymentTerms" className="cursor-pointer">
                  I agree to the payment terms and cancellation policy
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Free cancellation up to 24 hours before pickup. 50% refund for cancellations within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} disabled={isProcessingPayment} className="flex-1">
          Back
        </Button>
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={!acceptTerms || isProcessingPayment}
          className="flex-1"
        >
          {isProcessingPayment ? (
            <>
              <Skeleton className="h-4 w-20 mr-2" />
              Processing...
            </>
          ) : (
            `Pay ${formatCurrency(priceBreakdown.total)}`
          )}
        </Button>
      </div>
    </div>
  )
}
