import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { storeIdQuery } from '@/core/api/stores'
import type {
  CreateSubscriptionCheckoutResponse,
  SubscriptionCheckoutData,
  SubscriptionPricingData,
  VerifySubscriptionPaymentPayload,
  VerifySubscriptionPaymentResponse,
} from '@/core/types/subscription'

export type {
  SubscriptionCheckoutData,
  SubscriptionPricingData,
  VerifySubscriptionPaymentPayload,
  VerifySubscriptionPaymentResponse,
}

export async function fetchSubscriptionPricing(storeId: number): Promise<SubscriptionPricingData> {
  const res = await authenticatedFetch<{
    success: boolean
    data: SubscriptionPricingData
  }>(`${endpoints.subscriptionsPricing}${storeIdQuery(storeId)}`)
  return res.data
}

export async function createSubscriptionCheckout(
  storeId: number,
): Promise<SubscriptionCheckoutData> {
  const res = await authenticatedFetch<CreateSubscriptionCheckoutResponse>(
    `${endpoints.subscriptionsCheckout}${storeIdQuery(storeId)}`,
    { method: 'POST' },
  )
  return res.data
}

export async function verifySubscriptionPayment(
  payload: VerifySubscriptionPaymentPayload,
): Promise<VerifySubscriptionPaymentResponse['data']> {
  const res = await authenticatedFetch<VerifySubscriptionPaymentResponse>(
    endpoints.subscriptionsVerify,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  return res.data
}
