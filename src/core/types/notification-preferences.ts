export type NotificationSoundId =
  | 'default'
  | 'chime'
  | 'bell'
  | 'ping'
  | 'alert'
  | 'soft'
  | 'bright'
  | 'pulse'

export type NotificationPreferences = {
  chats: boolean
  online_orders: boolean
  pos_orders: boolean
  sound_id: NotificationSoundId
}

export type NotificationPreferencesResponse = {
  success: boolean
  message: string
  data: {
    store_id: number
    notification_preferences: NotificationPreferences
  }
}

export type UpdateNotificationPreferencesPayload = Partial<NotificationPreferences>
