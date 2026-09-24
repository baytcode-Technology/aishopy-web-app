import {
  registerPlatformAdminWebPushSubscription,
  unregisterPlatformAdminWebPushSubscription,
} from '@/core/api/platform-admin-web-push'
import { env } from '@/core/config/env'
import {
  getCurrentPushSubscription,
  getWebPushSupportStatus,
  registerServiceWorker,
  type WebPushSupportStatus,
} from '@/core/lib/web-push'

const ADMIN_ENDPOINT_STORAGE_KEY = 'aishopy_admin_web_push_endpoint'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function storeAdminEndpoint(endpoint: string | null) {
  try {
    if (endpoint) localStorage.setItem(ADMIN_ENDPOINT_STORAGE_KEY, endpoint)
    else localStorage.removeItem(ADMIN_ENDPOINT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getStoredAdminWebPushEndpoint(): string | null {
  try {
    return localStorage.getItem(ADMIN_ENDPOINT_STORAGE_KEY)
  } catch {
    return null
  }
}

export function getAdminWebPushSupportStatus(): WebPushSupportStatus {
  return getWebPushSupportStatus()
}

export async function enablePlatformAdminBrowserPush(): Promise<PushSubscription> {
  const status = getAdminWebPushSupportStatus()
  if (status === 'unsupported') {
    throw new Error('Browser notifications are not supported in this browser')
  }
  if (status === 'missing_vapid') {
    throw new Error('Browser push is not configured on this deployment')
  }
  if (status === 'denied') {
    throw new Error('Notifications are blocked. Enable them in your browser settings.')
  }

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted')
  }

  const registration = await registerServiceWorker()
  if (!registration) {
    throw new Error('Could not register the notification service worker')
  }
  await navigator.serviceWorker.ready

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    const key = urlBase64ToUint8Array(env.vapidPublicKey!)
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key as BufferSource,
    })
  }

  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Invalid push subscription')
  }

  await registerPlatformAdminWebPushSubscription({
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  })
  storeAdminEndpoint(json.endpoint)
  return subscription
}

export async function disablePlatformAdminBrowserPush(): Promise<void> {
  const subscription = await getCurrentPushSubscription()
  const endpoint = subscription?.endpoint ?? getStoredAdminWebPushEndpoint()

  if (endpoint) {
    try {
      await unregisterPlatformAdminWebPushSubscription(endpoint)
    } catch {
      /* still clear local */
    }
  }

  storeAdminEndpoint(null)
}

export async function syncPlatformAdminBrowserPushIfGranted(): Promise<boolean> {
  const status = getAdminWebPushSupportStatus()
  if (status !== 'granted') return false
  try {
    const subscription = await getCurrentPushSubscription()
    if (!subscription) return false
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false
    await registerPlatformAdminWebPushSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    })
    storeAdminEndpoint(json.endpoint)
    return true
  } catch {
    return false
  }
}

export async function isPlatformAdminBrowserPushSubscribed(): Promise<boolean> {
  const status = getAdminWebPushSupportStatus()
  if (status !== 'granted') return false
  const sub = await getCurrentPushSubscription()
  if (!sub) return false
  return Boolean(getStoredAdminWebPushEndpoint() || sub.endpoint)
}
