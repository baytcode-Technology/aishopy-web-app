import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { storeIdQuery } from '@/core/api/stores'

type RegisterResponse = {
  success: boolean
  data: { registered: true }
}

type UnregisterResponse = {
  success: boolean
  data: { removed: boolean }
}

export async function registerWebPushSubscription(
  storeId: number,
  payload: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  return authenticatedFetch<RegisterResponse>(
    `${endpoints.webPushSubscription}${storeIdQuery(storeId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
  )
}

export async function unregisterWebPushSubscription(storeId: number, endpoint: string) {
  return authenticatedFetch<UnregisterResponse>(
    `${endpoints.webPushSubscription}${storeIdQuery(storeId)}`,
    {
      method: 'DELETE',
      body: JSON.stringify({ endpoint }),
    },
  )
}
