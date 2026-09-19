import {
  registerWebPushSubscription,
  unregisterWebPushSubscription,
} from '@/core/api/web-push'
import { env } from '@/core/config/env'

const SW_PATH = '/sw.js'
const ENDPOINT_STORAGE_KEY = 'aishopy_web_push_endpoint'

export type WebPushSupportStatus =
  | 'unsupported'
  | 'missing_vapid'
  | 'denied'
  | 'default'
  | 'granted'

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

export function getWebPushSupportStatus(): WebPushSupportStatus {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  if (!env.vapidPublicKey) return 'missing_vapid'
  if (Notification.permission === 'denied') return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return 'default'
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  try {
    return await navigator.serviceWorker.register(SW_PATH, { scope: '/' })
  } catch (err) {
    console.error('[web-push] service worker register failed', err)
    return null
  }
}

function storeEndpoint(endpoint: string | null) {
  try {
    if (endpoint) localStorage.setItem(ENDPOINT_STORAGE_KEY, endpoint)
    else localStorage.removeItem(ENDPOINT_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function getStoredWebPushEndpoint(): string | null {
  try {
    return localStorage.getItem(ENDPOINT_STORAGE_KEY)
  } catch {
    return null
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  const registration = await registerServiceWorker()
  if (!registration) return null
  await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function enableBrowserPush(storeId: number): Promise<PushSubscription> {
  const status = getWebPushSupportStatus()
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
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(env.vapidPublicKey) as BufferSource,
    })
  }

  const json = subscription.toJSON()
  const endpoint = json.endpoint
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!endpoint || !p256dh || !auth) {
    throw new Error('Invalid push subscription from the browser')
  }

  await registerWebPushSubscription(storeId, {
    endpoint,
    keys: { p256dh, auth },
  })
  storeEndpoint(endpoint)
  return subscription
}

export async function disableBrowserPush(storeId: number): Promise<void> {
  const subscription = await getCurrentPushSubscription()
  const endpoint = subscription?.endpoint ?? getStoredWebPushEndpoint()

  if (endpoint) {
    try {
      await unregisterWebPushSubscription(storeId, endpoint)
    } catch {
      /* still drop local subscription */
    }
  }

  if (subscription) {
    await subscription.unsubscribe()
  }
  storeEndpoint(null)
}

/** Re-sync an existing granted subscription to the active store (e.g. after login). */
export async function syncBrowserPushIfGranted(storeId: number): Promise<boolean> {
  const status = getWebPushSupportStatus()
  if (status !== 'granted') return false
  try {
    const subscription = await getCurrentPushSubscription()
    if (!subscription) return false
    const json = subscription.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false
    await registerWebPushSubscription(storeId, {
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
    })
    storeEndpoint(json.endpoint)
    return true
  } catch {
    return false
  }
}

export async function unregisterStoredWebPushOnSignOut(storeId: number | null): Promise<void> {
  const endpoint = getStoredWebPushEndpoint()
  if (!endpoint || !storeId) {
    storeEndpoint(null)
    return
  }
  try {
    await unregisterWebPushSubscription(storeId, endpoint)
  } catch {
    /* ignore */
  }
  // Keep the browser PushSubscription so re-login can sync without re-Enable.
  storeEndpoint(null)
}
