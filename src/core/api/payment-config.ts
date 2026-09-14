import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { storeIdQuery } from '@/core/api/stores'
import type {
  PaymentConfigResponse,
  RazorpayMode,
  UpdatePaymentConfigPayload,
} from '@/core/types/payment-config'

export type RazorpaySetupTestCheckout = {
  order_id: number
  checkout_token: string
  key_id: string
  razorpay_order_id: string
  amount: number
  currency: string
  mode: RazorpayMode
  store_name: string
}

export type RazorpaySetupTestCheckoutResponse = {
  success: boolean
  message: string
  data: RazorpaySetupTestCheckout
}

export type VerifyRazorpaySetupTestPayload = {
  order_id: number
  checkout_token: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type VerifyRazorpaySetupTestResponse = {
  success: boolean
  message: string
  data: {
    test_passed: boolean
    test_passed_mode: RazorpayMode | null
    mode: RazorpayMode
  }
}

export async function fetchPaymentConfig(storeId: number): Promise<PaymentConfigResponse> {
  return authenticatedFetch<PaymentConfigResponse>(`${endpoints.paymentConfig}${storeIdQuery(storeId)}`)
}

export async function updatePaymentConfig(
  storeId: number,
  payload: UpdatePaymentConfigPayload,
): Promise<PaymentConfigResponse> {
  return authenticatedFetch<PaymentConfigResponse>(`${endpoints.paymentConfig}${storeIdQuery(storeId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function startRazorpaySetupTest(
  storeId: number,
): Promise<RazorpaySetupTestCheckoutResponse> {
  return authenticatedFetch<RazorpaySetupTestCheckoutResponse>(
    `${endpoints.paymentConfigRazorpayTestCheckout}${storeIdQuery(storeId)}`,
    { method: 'POST' },
  )
}

export async function verifyRazorpaySetupTest(
  storeId: number,
  payload: VerifyRazorpaySetupTestPayload,
): Promise<VerifyRazorpaySetupTestResponse> {
  return authenticatedFetch<VerifyRazorpaySetupTestResponse>(
    `${endpoints.paymentConfigRazorpayVerifyTest}${storeIdQuery(storeId)}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}
