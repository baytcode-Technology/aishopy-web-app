'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { AiThirdPartyConsentModal } from '@/components/store/AiThirdPartyConsentModal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Switch } from '@/components/ui/Switch'
import { fetchInboxAiSettings, updateInboxAiSettings } from '@/core/api/inbox-ai'
import { getErrorMessage } from '@/core/lib/api-error'
import { hasPremiumAccess } from '@/core/lib/subscription'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Tamil', 'Malayalam', 'Arabic']

const CUSTOM_PROMPT_PLACEHOLDER = `Examples you can copy:
• Call every customer sir or saar — warm shop tone
• Free delivery above ₹999 within Kerala
• COD available — ask size before confirming
• Reply in Manglish when customer writes Manglish (undo?, ethu size?)`

export default function ChatBoatPage() {
  const router = useRouter()
  const { store, refreshStore } = useStore()
  const premium = store ? hasPremiumAccess(store) : false

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [consentModalOpen, setConsentModalOpen] = useState(false)
  const [pendingConsentEnable, setPendingConsentEnable] = useState(false)
  const [language, setLanguage] = useState('English')
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchInboxAiSettings(store.id)
      setEnabled(res.data.ai_auto_reply_enabled)
      setHasConsent(res.data.ai_third_party_consented)
      setLanguage(res.data.ai_language?.trim() || 'English')
      setCustomPrompt(res.data.ai_system_prompt ?? '')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load Chat Boat settings'))
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    void load()
  }, [load])

  const saveSettings = async (options?: { grantConsent?: boolean }) => {
    if (!store?.id) return
    if (enabled && !premium) {
      router.push('/subscription')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateInboxAiSettings(store.id, {
        ai_auto_reply_enabled: options?.grantConsent ? true : enabled,
        ai_language: language,
        ai_system_prompt: customPrompt.trim() || null,
        ...(options?.grantConsent ? { ai_third_party_consent: true } : {}),
      })
      if (options?.grantConsent) {
        setHasConsent(true)
      }
      await refreshStore()
      setNotice('Chat Boat settings saved')
      setConsentModalOpen(false)
      setPendingConsentEnable(false)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save settings'))
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    if (enabled && !hasConsent) {
      setPendingConsentEnable(true)
      setConsentModalOpen(true)
      return
    }
    void saveSettings()
  }

  const handleToggleEnabled = (next: boolean) => {
    if (next && !hasConsent) {
      setPendingConsentEnable(true)
      setConsentModalOpen(true)
      return
    }
    setEnabled(next)
  }

  const handleConsentAgree = () => {
    setEnabled(true)
    void saveSettings({ grantConsent: true })
  }

  const handleConsentClose = () => {
    setConsentModalOpen(false)
    setPendingConsentEnable(false)
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Chat Boat"
        subtitle="Auto-reply to customer inbox messages"
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-4">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
              <MenuIcon name="magic" className="h-[22px] w-[22px]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-extrabold tracking-tight text-ink">Inbox auto-reply</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Replies on WhatsApp and Instagram with product links from your store.
              </p>
            </div>
          </div>
        </div>

        {!premium ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Business plan required</p>
            <p className="text-sm text-amber-800">
              Upgrade to Business to enable Chat Boat auto-replies for your customers.
            </p>
            <Button label="View plans" variant="outline" onClick={() => router.push('/subscription')} />
          </div>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-surface p-4">
              <div className="flex items-center justify-between py-1">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="pl-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                    Auto-reply enabled
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    When on, Chat Boat answers customer messages automatically.
                  </p>
                </div>
                <Switch
                  value={enabled}
                  onValueChange={handleToggleEnabled}
                  disabled={!premium || saving}
                  aria-label="Auto-reply enabled"
                  onTrack="primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="pl-0.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
                Default reply language
              </p>
              <p className="text-xs text-gray-500">
                Chat Boat replies in whatever language the customer types (English, Malayalam, Manglish
                like &quot;undo?&quot; or &quot;ethu size?&quot;, mixed, etc.). This setting is only used
                when detection is unsure.
              </p>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`rounded-2xl border-2 px-4 py-2 text-[15px] font-semibold ${
                      language === lang
                        ? 'border-brand-primary bg-brand-primary text-brand-on-primary'
                        : 'border-ink bg-surface text-ink'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Custom instructions (optional)"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder={CUSTOM_PROMPT_PLACEHOLDER}
              multiline
              className="min-h-[120px]"
            />

            <p className="text-xs text-gray-500">
              Custom instructions actively shape how Chat Boat replies. It shares product links from
              your storefront, ignores off-topic questions, and will not share code or passwords. You
              can take over any chat manually from the inbox. Third-party AI providers process
              customer messages only to generate replies — see consent when enabling.
            </p>

            <Button label="Save settings" loading={saving} onClick={() => void handleSave()} />
          </>
        )}
      </div>

      <AiThirdPartyConsentModal
        open={consentModalOpen}
        saving={saving && pendingConsentEnable}
        onClose={handleConsentClose}
        onAgree={handleConsentAgree}
      />
    </main>
  )
}
