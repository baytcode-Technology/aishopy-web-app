'use client'

import { pathFromNotificationData } from '@/core/lib/notification-path'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type ToastItem = {
  id: number
  title: string
  body: string
  data: Record<string, unknown>
}

/**
 * Shows an in-app toast when the service worker receives push while a tab is focused
 * (iOS often suppresses system banners in the foreground).
 */
export function PushToastListener() {
  const router = useRouter()
  const [toast, setToast] = useState<ToastItem | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const onMessage = (event: MessageEvent) => {
      const raw = event.data
      if (!raw || typeof raw !== 'object') return
      if ((raw as { type?: string }).type !== 'push-toast') return

      const title = typeof (raw as { title?: unknown }).title === 'string' ? (raw as { title: string }).title : 'AiShopy'
      const body = typeof (raw as { body?: unknown }).body === 'string' ? (raw as { body: string }).body : ''
      const data =
        (raw as { data?: unknown }).data && typeof (raw as { data: unknown }).data === 'object'
          ? ((raw as { data: Record<string, unknown> }).data ?? {})
          : {}

      setToast({ id: Date.now(), title, body, data })
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 5000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!toast) return null

  const open = () => {
    const path = pathFromNotificationData(toast.data)
    setToast(null)
    try {
      router.push(path)
    } catch {
      window.location.assign(path)
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <button
        type="button"
        onClick={open}
        className="pointer-events-auto w-full max-w-md rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-left shadow-lg"
        aria-live="polite"
      >
        <p className="truncate text-[14px] font-bold text-ink">{toast.title}</p>
        {toast.body ? (
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-gray-600">{toast.body}</p>
        ) : null}
      </button>
    </div>
  )
}
