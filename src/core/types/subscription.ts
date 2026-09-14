export type SubscriptionCheckoutData = {
  checkout_id: number
  key_id: string
  order_id: string
  amount: number
  currency: string
  plan: 'business'
  store_name: string
  is_trial: boolean
  regular_amount: number
}

export type SubscriptionPricingData = {
  trial_eligible: boolean
  currency: 'INR' | 'USD'
  charge_amount: number
  charge_minor_units: number
  regular_amount: number
  regular_minor_units: number
  is_trial: boolean
  price_label: string
  compare_at_label: string
}

export type CreateSubscriptionCheckoutResponse = {
  success: boolean
  message: string
  data: SubscriptionCheckoutData
}

export type VerifySubscriptionPaymentPayload = {
  checkout_id: number
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type VerifySubscriptionPaymentResponse = {
  success: boolean
  message: string
  data: {
    store: {
      subscription_plan: string
      subscription_expires_at: string | null
    }
    subscription_plan: string
    subscription_expires_at: string | null
  }
}
