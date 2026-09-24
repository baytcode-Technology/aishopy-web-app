'use client'

import { Button } from '@/components/ui/Button'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  disablePlatformAdminBrowserPush,
  enablePlatformAdminBrowserPush,
  getAdminWebPushSupportStatus,
  isPlatformAdminBrowserPushSubscribed,
  syncPlatformAdminBrowserPushIfGranted,
} from '@/core/lib/platform-admin-web-push'
import { registerServiceWorker } from '@/core/lib/web-push'
import { useCallback, useEffect, useState } from 'react'

export function AdminAlertsEnableCard() {
  const [status, setStatus] = useState(getAdminWebPushSupportStatus())
  const [subscribed, setSubscribed] = useState(false)
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

  const handleEnable = async () => {
    setBusy(true)
    setError(null)
    try {
      await enablePlatformAdminBrowserPush()
      setSubscribed(true)
      setStatus(getAdminWebPushSupportStatus())
    } catch (e) {
      setError(getErrorMessage(e, 'Could not enable admin alerts'))
    } finally {
      setBusy(false)
    }
  }

  const handleDisable = async () => {
    setBusy(true)
    setError(null)
    try {
      await disablePlatformAdminBrowserPush()
      setSubscribed(false)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not disable admin alerts'))
    } finally {
      setBusy(false)
    }
  }

  const hint =
    status === 'unsupported'
      ? 'This browser cannot receive web push. On iPhone, install AiShopy and open from the home screen.'
      : status === 'missing_vapid'
        ? 'Browser push is not configured (missing VAPID public key).'
        : status === 'denied'
          ? 'Notifications are blocked. Allow them in site settings, then enable again.'
          : 'Get alerts for new tickets, support replies, and new user signups.'

  return (
    <div className="mx-3 mb-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 lg:mx-0">
      <p className="text-[13px] font-semibold text-ink">Admin alerts</p>
      <p className="mt-1 text-[12px] leading-4 text-gray-500">{hint}</p>
      {error ? <p className="mt-1 text-[12px] text-[#E11D48]">{error}</p> : null}
      <div className="mt-2">
        {subscribed ? (
          <Button
            label={busy ? 'Disabling…' : 'Disable alerts'}
            variant="outline"
            disabled={busy}
            onClick={() => void handleDisable()}
          />
        ) : (
          <Button
            label={busy ? 'Enabling…' : 'Enable alerts'}
            disabled={busy || status === 'unsupported' || status === 'missing_vapid' || status === 'denied'}
            onClick={() => void handleEnable()}
          />
        )}
      </div>
    </div>
  )
}
