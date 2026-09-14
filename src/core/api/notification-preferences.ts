import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import { storeIdQuery } from '@/core/api/stores'
import type {
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesPayload,
} from '@/core/types/notification-preferences'

export async function fetchNotificationPreferences(
  storeId: number,
): Promise<NotificationPreferencesResponse> {
  return authenticatedFetch<NotificationPreferencesResponse>(
    `${endpoints.notificationPreferences}${storeIdQuery(storeId)}`,
  )
}

export async function updateNotificationPreferences(
  storeId: number,
  payload: UpdateNotificationPreferencesPayload,
): Promise<NotificationPreferencesResponse> {
  return authenticatedFetch<NotificationPreferencesResponse>(
    `${endpoints.notificationPreferences}${storeIdQuery(storeId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}
