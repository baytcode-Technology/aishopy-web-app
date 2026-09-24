import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

type RegisterResponse = {
  success: boolean
  data: { registered: true }
}

type UnregisterResponse = {
  success: boolean
  data: { removed: boolean }
}

export async function registerPlatformAdminWebPushSubscription(payload: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  return authenticatedFetch<RegisterResponse>(endpoints.platformAdminWebPushSubscription, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function unregisterPlatformAdminWebPushSubscription(endpoint: string) {
  return authenticatedFetch<UnregisterResponse>(endpoints.platformAdminWebPushSubscription, {
    method: 'DELETE',
    body: JSON.stringify({ endpoint }),
  })
}
