'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { NotificationSettingsSkeleton } from '@/components/ui/Skeleton'
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from '@/core/api/notification-preferences'
import { getErrorMessage } from '@/core/lib/api-error'
import type { NotificationPreferences } from '@/core/types/notification-preferences'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

function notificationSettingsErrorMessage(error: unknown, fallback: string): string {
  const message = getErrorMessage(error, fallback)
  if (message.includes('notification_preferences')) {
    return 'Database update required: run migration 021_notification_preferences.sql on Supabase, then try again.'
  }
  return fallback
}

export default function NotificationsPage() {
  const router = useRouter()
  const { store } = useStore()
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchNotificationPreferences(store.id)
      setPrefs(res.data.notification_preferences)
    } catch (e) {
      setPrefs(null)
      setError(notificationSettingsErrorMessage(e, 'Could not load notification settings'))
    } finally {
      setLoading(false)
    }
  }, [store?.id])

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
            <p className="text-[14px] leading-5 text-gray-500">
              Choose which events show alerts. Uses your phone&apos;s default notification sound.
              When the app is fully closed, Firebase push setup is required on Android.
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
                Custom sounds and previews are coming soon. Alerts currently use your phone&apos;s
                default notification tone.
              </p>
              <div className="mt-2 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3">
                <p className="mb-1 text-[13px] font-bold text-ink">Coming soon</p>
                <p className="text-[13px] leading-5 text-gray-500">
                  Pick different ringtones per alert type and upload your own sound.
                </p>
              </div>
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
