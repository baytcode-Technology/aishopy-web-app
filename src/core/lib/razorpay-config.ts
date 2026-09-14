import { env } from '@/core/config/env'

const PRODUCTION_API_BASE = 'https://aishopy.up.railway.app'
const WEBHOOK_PATH = '/api/webhooks/razorpay'

export function getRazorpayWebhookUrl(): { url: string; isProductionFallback: boolean } {
  const base = env.apiBaseUrl.trim() || PRODUCTION_API_BASE
  return {
    url: `${base.replace(/\/$/, '')}${WEBHOOK_PATH}`,
    isProductionFallback: !env.apiBaseUrl.trim(),
  }
}

export function razorpayKeyMatchesMode(keyId: string, mode: 'test' | 'live'): string | null {
  const trimmed = keyId.trim()
  if (!trimmed) return null
  if (!trimmed.startsWith('rzp_test_') && !trimmed.startsWith('rzp_live_')) {
    return 'Key ID must start with rzp_test_ or rzp_live_'
  }
  if (mode === 'test' && !trimmed.startsWith('rzp_test_')) {
    return 'Test mode needs a test Key ID (rzp_test_...)'
  }
  if (mode === 'live' && !trimmed.startsWith('rzp_live_')) {
    return 'Live mode needs a live Key ID (rzp_live_...). Use Razorpay Dashboard after your business is verified.'
  }
  return null
}
