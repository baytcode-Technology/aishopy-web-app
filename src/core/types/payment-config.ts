export type RazorpayMode = 'test' | 'live'

export type MerchantPaymentConfig = {
  cod: { enabled: boolean }
  razorpay: {
    enabled: boolean
    key_id: string | null
    key_secret_masked: string | null
    webhook_secret_masked: string | null
    mode: RazorpayMode
    configured: boolean
    test_passed: boolean
    test_passed_mode: RazorpayMode | null
    test_required: boolean
  }
  upi: {
    enabled: boolean
    vpa: string | null
    display_name: string | null
    qr_image_url: string | null
  }
}

export type PaymentConfigResponse = {
  success: boolean
  message: string
  data: {
    store_id: number
    payment_config: MerchantPaymentConfig
  }
}

export type UpdatePaymentConfigPayload = {
  cod?: { enabled: boolean }
  razorpay?: {
    enabled?: boolean
    key_id?: string
    key_secret?: string
    webhook_secret?: string
    mode?: RazorpayMode
  }
  upi?: {
    enabled?: boolean
    vpa?: string
    display_name?: string | null
    qr_image_url?: string | null
  }
}
