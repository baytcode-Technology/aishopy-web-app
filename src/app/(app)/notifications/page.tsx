'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { NotificationSettingsSkeleton } from '@/components/ui/Skeleton'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/core/api/notification-preferences'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  disableBrowserPush,
  enableBrowserPush,
  getCurrentPushSubscription,
  getWebPushSupportStatus,
  registerServiceWorker,
  syncBrowserPushIfGranted,
  type WebPushSupportStatus,
} from '@/core/lib/web-push'
import type { NotificationPreferences } from '@/core/types/notification-preferences'
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

function notificationSettingsErrorMessage(error: unknown, fallback: string): string {
  const message = getErrorMessage(error, fallback)
  if (message.includes('notification_preferences')) {
    return 'Database update required: run migration 021_notification_preferences.sql on Supabase, then try again.'
  }
  if (message.includes('store_web_push_subscriptions')) {
    return 'Database update required: run migration 059_store_web_push_subscriptions.sql on Supabase, then try again.'
  }
  return fallback
}

function supportHint(status: WebPushSupportStatus): string {
  switch (status) {
    case 'unsupported':
      return 'This browser does not support web push notifications.'
    case 'missing_vapid':
      return 'Browser push is not configured on this deployment yet (missing VAPID public key).'
    case 'denied':
      return 'Notifications are blocked. Allow them in your browser site settings, then try again.'
    case 'granted':
      return 'Browser alerts are allowed. Keep this enabled to receive chat and order pushes here.'
    default:
      return 'Enable browser alerts to get chat and order notifications while using AiShopy in this browser or as an installed app.'
  }
}

export default function NotificationsPage() {
  const router = useRouter()
  const { store } = useStore()
  const { canInstall, installed, promptInstall } = usePwaInstallPrompt()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pushBusy, setPushBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pushStatus, setPushStatus] = useState<WebPushSupportStatus>('unsupported')
  const [subscribed, setSubscribed] = useState(false)

  const refreshPushState = useCallback(async () => {
    const status = getWebPushSupportStatus()
    setPushStatus(status)
    if (status === 'granted' || status === 'default' || status === 'denied') {
      await registerServiceWorker()
    }
    if (status === 'granted') {
      const sub = await getCurrentPushSubscription()
      setSubscribed(Boolean(sub))
      if (store?.id && sub) {
        await syncBrowserPushIfGranted(store.id)
      }
    } else {
      setSubscribed(false)
    }
  }, [store?.id])

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchNotificationPreferences(store.id)
      setPrefs(res.data.notification_preferences)
      await refreshPushState()
    } catch (e) {
      setPrefs(null)
      setError(notificationSettingsErrorMessage(e, 'Could not load notification settings'))
    } finally {
      setLoading(false)
    }
  }, [refreshPushState, store?.id])

  useEffect(() => {
    void load()
  }, [load])

  const save = async (next: NotificationPreferences) => {
    if (!store?.id) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await updateNotificationPreferences(store.id, {
        ...next,
        sound_id: 'default',
      })
      setPrefs(res.data.notification_preferences)
      setNotice('Notification settings saved')
    } catch (e) {
      setError(notificationSettingsErrorMessage(e, 'Could not save notification settings'))
      await load()
    } finally {
      setSaving(false)
    }
  }

  const patchPref = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K],
  ) => {
    if (!prefs) return
    const next = { ...prefs, [key]: value, sound_id: 'default' as const }
    setPrefs(next)
    void save(next)
  }

  const handleEnablePush = async () => {
    if (!store?.id) return
    setPushBusy(true)
    setError(null)
    setNotice(null)
    try {
      await enableBrowserPush(store.id)
      setNotice('Browser alerts enabled')
      await refreshPushState()
    } catch (e) {
      setError(notificationSettingsErrorMessage(e, 'Could not enable browser alerts'))
      await refreshPushState()
    } finally {
      setPushBusy(false)
    }
  }

  const handleDisablePush = async () => {
    if (!store?.id) return
    setPushBusy(true)
    setError(null)
    setNotice(null)
    try {
      await disableBrowserPush(store.id)
      setNotice('Browser alerts disabled')
      await refreshPushState()
    } catch (e) {
      setError(notificationSettingsErrorMessage(e, 'Could not disable browser alerts'))
      await refreshPushState()
    } finally {
      setPushBusy(false)
    }
  }

  const handleInstall = async () => {
    setNotice(null)
    const accepted = await promptInstall()
    if (accepted) setNotice('AiShopy install started')
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Notifications"
        subtitle="Alerts & preferences"
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-2">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {loading ? (
          <NotificationSettingsSkeleton />
        ) : !prefs ? (
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-2xl border border-gray-200 bg-surface px-4 py-4 shadow-sm hover:opacity-90"
          >
            <p className="text-center text-[15px] font-semibold text-ink">Could not load settings</p>
            <p className="mt-1 text-center text-[13px] text-gray-500">Tap to try again</p>
            {error ? <p className="mt-2 text-center text-[12px] text-[#E11D48]">{error}</p> : null}
          </button>
        ) : (
          <>
            {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

            <div className="flex w-full flex-col gap-3 rounded-[28px] border border-gray-200 bg-surface px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-ink">Browser alerts</p>
              <p className="text-[13px] leading-5 text-gray-500">{supportHint(pushStatus)}</p>
              {subscribed ? (
                <Button
                  label={pushBusy ? 'Disabling…' : 'Disable browser alerts'}
                  variant="outline"
                  disabled={pushBusy}
                  onClick={() => void handleDisablePush()}
                />
              ) : (
                <Button
                  label={pushBusy ? 'Enabling…' : 'Enable browser alerts'}
                  disabled={
                    pushBusy ||
                    pushStatus === 'unsupported' ||
                    pushStatus === 'missing_vapid' ||
                    pushStatus === 'denied'
                  }
                  onClick={() => void handleEnablePush()}
                />
              )}
            </div>

            <div className="flex w-full flex-col gap-3 rounded-[28px] border border-gray-200 bg-surface px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-ink">Install app</p>
              {installed ? (
                <p className="text-[13px] leading-5 text-gray-500">
                  AiShopy is installed on this device. Background alerts work best from the
                  installed app.
                </p>
              ) : canInstall ? (
                <>
                  <p className="text-[13px] leading-5 text-gray-500">
                    Install AiShopy for quicker access and better background notification delivery.
                  </p>
                  <Button label="Install AiShopy" variant="outline" onClick={() => void handleInstall()} />
                </>
              ) : (
                <p className="text-[13px] leading-5 text-gray-500">
                  On desktop Chrome/Edge, use the install icon in the address bar when available. On
                  iPhone/iPad Safari: Share → Add to Home Screen.
                </p>
              )}
            </div>

            <p className="text-[14px] leading-5 text-gray-500">
              Choose which events send alerts. These preferences apply to both the mobile app and
              browser alerts for this store.
            </p>

            <div className="flex w-full flex-col gap-4 rounded-[28px] border border-gray-200 bg-surface px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-ink">Alerts</p>
              <ToggleRow
                label="Chats"
                hint="WhatsApp and Instagram messages"
                value={prefs.chats}
                disabled={saving}
                onValueChange={(v) => patchPref('chats', v)}
              />
              <ToggleRow
                label="Online orders"
                hint="New orders from your storefront"
                value={prefs.online_orders}
                disabled={saving}
                onValueChange={(v) => patchPref('online_orders', v)}
              />
              <ToggleRow
                label="POS orders"
                hint="Walk-in orders created in the app"
                value={prefs.pos_orders}
                disabled={saving}
                onValueChange={(v) => patchPref('pos_orders', v)}
              />
            </div>

            <div className="flex w-full flex-col gap-2 rounded-[28px] border border-gray-200 bg-surface px-4 py-5 shadow-sm">
              <p className="text-base font-semibold text-ink">Notification sound</p>
              <p className="text-[13px] leading-5 text-gray-500">
                Browser alerts use your system notification sound. Custom tones are coming later.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}

function ToggleRow({
  label,
  hint,
  value,
  disabled,
  onValueChange,
}: {
  label: string
  hint: string
  value: boolean
  disabled?: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-[15px] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-[13px] text-gray-500">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onValueChange(!value)}
        className={`relative h-6 w-11 rounded-full ${value ? 'bg-brand-primary' : 'bg-[#e4e4e7]'} ${
          disabled ? 'opacity-45' : ''
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${
            value ? 'right-0.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}
