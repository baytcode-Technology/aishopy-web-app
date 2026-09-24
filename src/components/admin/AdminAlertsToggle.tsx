'use client'

import { getErrorMessage } from '@/core/lib/api-error'
import {
  disablePlatformAdminBrowserPush,
  enablePlatformAdminBrowserPush,
  getAdminWebPushSupportStatus,
  getStoredAdminWebPushEndpoint,
  isPlatformAdminBrowserPushSubscribed,
  syncPlatformAdminBrowserPushIfGranted,
} from '@/core/lib/platform-admin-web-push'
import { registerServiceWorker } from '@/core/lib/web-push'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  /** Compact row for sidebar / overflow menus */
  variant?: 'row' | 'menu'
  className?: string
}

/** Sync guess so the switch does not flash off→on when opening the menu. */
function initialSubscribed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission !== 'granted') return false
    return Boolean(getStoredAdminWebPushEndpoint())
  } catch {
    return false
  }
}

export function AdminAlertsToggle({ variant = 'row', className = '' }: Props) {
  const [status, setStatus] = useState(getAdminWebPushSupportStatus())
  const [subscribed, setSubscribed] = useState(initialSubscribed)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const next = getAdminWebPushSupportStatus()
    setStatus(next)
    if (next === 'granted' || next === 'default' || next === 'denied') {
      await registerServiceWorker()
    }
    if (next === 'granted') {
      await syncPlatformAdminBrowserPushIfGranted()
      setSubscribed(await isPlatformAdminBrowserPushSubscribed())
    } else {
      setSubscribed(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const disabled =
    busy || status === 'unsupported' || status === 'missing_vapid' || status === 'denied'

  const handleToggle = async () => {
    if (disabled && !subscribed) return
    setBusy(true)
    setError(null)
    try {
      if (subscribed) {
        await disablePlatformAdminBrowserPush()
        setSubscribed(false)
      } else {
        await enablePlatformAdminBrowserPush()
        setSubscribed(true)
        setStatus(getAdminWebPushSupportStatus())
      }
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update admin alerts'))
    } finally {
      setBusy(false)
    }
  }

  const hint =
    status === 'unsupported'
      ? 'Not supported here'
      : status === 'missing_vapid'
        ? 'Push not configured'
        : status === 'denied'
          ? 'Blocked in browser settings'
          : null

  return (
    <div className={className}>
      <div
        className={
          variant === 'menu'
            ? 'flex items-center justify-between gap-3 px-4 py-2.5'
            : 'flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5'
        }
      >
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">Admin alerts</p>
          {hint ? <p className="mt-0.5 text-[11px] leading-4 text-gray-500">{hint}</p> : null}
          {error ? <p className="mt-0.5 text-[11px] text-[#E11D48]">{error}</p> : null}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={subscribed}
          aria-label="Admin alerts"
          disabled={disabled && !subscribed}
          onClick={() => void handleToggle()}
          className={`relative h-6 w-11 shrink-0 rounded-full ${
            subscribed ? 'bg-brand-primary' : 'bg-[#e4e4e7]'
          } ${busy || (disabled && !subscribed) ? 'opacity-45' : ''}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
              subscribed ? 'right-0.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>
    </div>
  )
}
