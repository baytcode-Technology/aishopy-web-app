'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

function pathFromMessage(data: { path?: unknown; url?: unknown }): string | null {
  if (typeof data.path === 'string' && data.path.startsWith('/')) return data.path
  if (typeof data.url === 'string') {
    try {
      const parsed = new URL(data.url, window.location.origin)
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

/** Handles SW postMessage fallback when WindowClient.navigate is unavailable. */
export function NotificationNavigateListener() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if ((data as { type?: string }).type !== 'notification-navigate') return

      const path = pathFromMessage(data as { path?: unknown; url?: unknown })
      if (!path) return

      try {
        router.push(path)
      } catch {
        window.location.assign(path)
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [router])

  return null
}
