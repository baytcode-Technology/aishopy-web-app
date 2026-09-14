'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MenuIcon } from '@/components/ui/MenuIcons'
import {
  clearWhatsAppChatHistory,
  completeWhatsAppOnboarding,
  fetchWhatsAppConnectionStatus,
  getWhatsAppConnectUrl,
  offboardWhatsApp,
  triggerWhatsAppSync,
  type WhatsAppConnectionStatus,
  type WhatsAppSyncJob,
} from '@/core/api/whatsapp-connect'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  syncStuckReason,
  WHATSAPP_FIX_STEPS,
  WHATSAPP_PREP_STEPS,
} from '@/core/lib/whatsapp-coexistence-steps'
import {
  openWhatsAppEmbeddedSignupAuthSession,
  persistWhatsAppOAuthStoreId,
} from '@/core/lib/whatsapp-oauth'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type ScreenPhase = 'loading' | 'disconnected' | 'oauth' | 'connected' | 'error'

function syncJobLabel(job: WhatsAppSyncJob): string {
  const type = job.sync_type === 'smb_app_state_sync' ? 'Contacts' : 'Chat history'
  const status =
    job.status === 'in_progress'
      ? 'Syncing…'
      : job.status === 'completed'
        ? 'Done'
        : job.status === 'declined'
          ? 'Skipped'
          : job.status === 'failed'
            ? 'Failed'
            : 'Pending'
  return `${type}: ${status}`
}

function StepList({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="flex w-full flex-col gap-3">
      <h2 className="text-center text-base font-semibold text-ink">{title}</h2>
      {steps.map((step, index) => (
        <p key={step} className="text-left text-[15px] leading-6 text-gray-500">
          {`${index + 1}. ${step}`}
        </p>
      ))}
    </div>
  )
}

function SyncProgress({ status }: { status: WhatsAppConnectionStatus }) {
  if (!status.connected) return null

  if (status.sync_jobs.length === 0) {
    return (
      <div className="flex w-full flex-col gap-3">
        <h2 className="text-center text-base font-semibold text-ink">Contact sync has not started</h2>
        <p className="text-center text-[15px] leading-6 text-gray-500">{syncStuckReason(status)}</p>
        <StepList title="How to fix" steps={WHATSAPP_FIX_STEPS} />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-2">
      {status.sync_jobs.map((job) => (
        <p key={job.id} className="text-center text-[15px] text-gray-500">
          {syncJobLabel(job)}
        </p>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary"
      aria-label="Loading"
    />
  )
}

export default function ConnectWhatsAppPage() {
  const router = useRouter()
  const { store } = useStore()
  const [phase, setPhase] = useState<ScreenPhase>('loading')
  const [connection, setConnection] = useState<WhatsAppConnectionStatus | null>(null)
  const [retryingSync, setRetryingSync] = useState(false)
  const [offboarding, setOffboarding] = useState(false)
  const [confirmClearHistory, setConfirmClearHistory] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)
  const [historyCleared, setHistoryCleared] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const oauthRunRef = useRef(0)

  const refreshStatus = useCallback(async () => {
    if (!store?.id) return null
    const res = await fetchWhatsAppConnectionStatus(store.id)
    setConnection(res.data)
    return res.data
  }, [store?.id])

  const startOAuth = useCallback(async () => {
    if (!store?.id) return
    const runId = ++oauthRunRef.current
    setPhase('oauth')
    setError(null)
    setNotice(null)

    try {
      persistWhatsAppOAuthStoreId(store.id)
      const res = await getWhatsAppConnectUrl(store.id)
      if (oauthRunRef.current !== runId) return

      if (res.data.signupUrlType === 'hosted-embedded-signup') {
        setPhase('error')
        setError(
          'Connect misconfigured: Server returned a Hosted ES URL which cannot complete in the mobile app.',
        )
        return
      }

      const authResult = await openWhatsAppEmbeddedSignupAuthSession({
        signupUrl: res.data.url,
        redirectUri: res.data.redirectUri ?? undefined,
      })

      if (oauthRunRef.current !== runId) return

      if ('type' in authResult) {
        if (authResult.type === 'cancelled' || authResult.type === 'dismissed') {
          const status = await refreshStatus()
          if (status?.connected) {
            setPhase('connected')
            setHistoryCleared(false)
            setNotice('WhatsApp connected — Your number is linked to AiShopy')
            return
          }
          setPhase('disconnected')
          if (authResult.type === 'dismissed') {
            setError(
              'Connection not finished: Meta did not return an authorization code. Close any leftover browser tab and tap Connect WhatsApp again.',
            )
          }
          return
        }
        setPhase('error')
        setError(`Connect failed: ${authResult.message}`)
        return
      }

      await completeWhatsAppOnboarding(store.id, {
        code: authResult.code,
        state: authResult.state,
      })

      const status = await refreshStatus()

      if (status?.connected) {
        setPhase('connected')
        setHistoryCleared(false)
        if (status.sync_jobs.length === 0) {
          setNotice(
            'WhatsApp connected — Number linked. If contact sync has not started, follow the steps on this screen, then tap Retry sync.',
          )
        } else {
          setNotice('WhatsApp connected — Your number is linked to AiShopy')
        }
      } else {
        setPhase('disconnected')
        setError('Connection not completed: Finish signup in Meta or tap Connect WhatsApp to try again.')
      }
    } catch (e: unknown) {
      if (oauthRunRef.current !== runId) return
      setPhase('error')
      setError(`Connect failed: ${getErrorMessage(e, 'Unknown error')}`)
    }
  }, [refreshStatus, store?.id])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!store?.id) return
      try {
        const status = await refreshStatus()
        if (cancelled) return
        setPhase(status?.connected ? 'connected' : 'disconnected')
      } catch (e: unknown) {
        if (!cancelled) {
          setPhase('error')
          setError(`Could not load WhatsApp status: ${getErrorMessage(e, 'Unknown error')}`)
        }
      }
    })()

    return () => {
      cancelled = true
      oauthRunRef.current += 1
    }
  }, [store?.id, refreshStatus])

  const handleOffboardAndReconnect = async () => {
    if (!store?.id) return
    setOffboarding(true)
    setError(null)
    try {
      const result = await offboardWhatsApp(store.id)
      setConnection(null)
      setPhase('disconnected')
      const steps =
        result.data.merchantSteps.length > 0
          ? result.data.merchantSteps.join('\n\n')
          : [
              'On the phone, open WhatsApp Business → Settings → Account → Business platform → Disconnect from BaytCode / AiShopy.',
              'Wait about one minute, then tap Connect WhatsApp and finish any QR or verification code Meta shows.',
            ].join('\n\n')
      setNotice(
        `Disconnected on server — Also disconnect in WhatsApp Business → Settings → Account → Business platform, then Connect again.\n\n${steps}`,
      )
    } catch (e: unknown) {
      setError(`Offboard failed: ${getErrorMessage(e, 'Unknown error')}`)
    } finally {
      setOffboarding(false)
    }
  }

  const handleRetrySync = async () => {
    if (!store?.id) return
    setRetryingSync(true)
    setError(null)
    try {
      await triggerWhatsAppSync(store.id)
      setNotice('Sync started — Contact and history sync triggered')
      await refreshStatus()
      setPhase('connected')
    } catch (e: unknown) {
      setError(`Sync failed: ${getErrorMessage(e, 'Unknown error')}`)
      await refreshStatus().catch(() => null)
    } finally {
      setRetryingSync(false)
    }
  }

  const handleClearChatHistory = async () => {
    if (!store?.id) return
    setClearingHistory(true)
    try {
      const res = await clearWhatsAppChatHistory(store.id)
      setHistoryCleared(true)
      setConfirmClearHistory(false)
      setNotice(
        res.data.deletedConversations === 0
          ? 'Chats deleted — No previous WhatsApp chats to remove'
          : `Chats deleted — ${res.data.deletedConversations} conversation${
              res.data.deletedConversations === 1 ? '' : 's'
            } removed from AiShopy`,
      )
    } catch (e: unknown) {
      setError(`Could not delete chats: ${getErrorMessage(e, 'Unknown error')}`)
    } finally {
      setClearingHistory(false)
    }
  }

  const subtitle =
    phase === 'connected'
      ? (connection?.whatsapp_number ?? 'Connected')
      : phase === 'disconnected'
        ? 'Not connected'
        : 'Link your WhatsApp Business account'

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Connect WhatsApp"
        subtitle={subtitle}
        onBack={() => router.back()}
        showSettings={false}
      />
      <div className="flex flex-col items-center justify-center gap-6 px-5 pb-10 pt-10">
        {notice ? (
          <p className="w-full whitespace-pre-line text-center text-sm font-semibold text-brand-green">{notice}</p>
        ) : null}
        {error ? <p className="w-full text-center text-sm text-[#E11D48]">{error}</p> : null}

        {phase === 'loading' || phase === 'oauth' ? <Spinner /> : null}

        {phase === 'connected' ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-brand-primary">
            <MenuIcon name="whatsapp" className="h-7 w-7" />
          </div>
        ) : null}

        {phase === 'loading' ? (
          <p className="text-center text-[15px] text-gray-500">Checking connection…</p>
        ) : null}

        {phase === 'disconnected' ? (
          <>
            <h2 className="text-center text-xl font-semibold text-ink">Not connected</h2>
            <p className="text-center text-[15px] leading-6 text-gray-500">
              Link your WhatsApp Business account to receive and reply to customer messages in
              Messages.
            </p>
            <StepList title="Before you connect" steps={WHATSAPP_PREP_STEPS} />
            <Button label="Connect WhatsApp" onClick={() => void startOAuth()} />
          </>
        ) : null}

        {phase === 'oauth' ? (
          <p className="text-center text-[15px] text-gray-500">Opening Meta connection…</p>
        ) : null}

        {phase === 'connected' ? (
          <>
            <h2 className="text-center text-xl font-semibold text-ink">WhatsApp connected</h2>
            <p className="text-center text-[15px] text-gray-500">
              {connection?.is_on_biz_app
                ? 'Phone + inbox coexistence is active.'
                : 'Your number is linked. Coexistence sync will complete when Meta approves Tech Provider access.'}
            </p>
            {connection ? <SyncProgress status={connection} /> : null}
            {!historyCleared ? (
              <Button
                label="Delete previous account chats"
                variant="outline"
                onClick={() => setConfirmClearHistory(true)}
              />
            ) : (
              <p className="text-center text-[15px] text-gray-500">Previous account chats deleted</p>
            )}
            <Button label="Reconnect account" variant="outline" onClick={() => void startOAuth()} />
            <Button label="Done" onClick={() => router.back()} />
          </>
        ) : null}

        {phase === 'error' ? (
          <>
            <p className="text-center text-[15px] text-gray-500">
              Something went wrong. Check your network and try again.
            </p>
            <Button label="Retry" onClick={() => void startOAuth()} />
            <Button label="Go back" variant="outline" onClick={() => router.back()} />
          </>
        ) : null}

        {phase === 'connected' && connection?.connected ? (
          <Button
            label={retryingSync ? 'Retrying sync…' : 'Retry sync'}
            variant="outline"
            disabled={retryingSync}
            onClick={() => void handleRetrySync()}
          />
        ) : null}

        {phase !== 'loading' && phase !== 'oauth' ? (
          <Button
            label={offboarding ? 'Disconnecting…' : 'Disconnect & reconnect from scratch'}
            variant="outline"
            disabled={offboarding}
            onClick={() => void handleOffboardAndReconnect()}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmClearHistory}
        title="Delete previous account chats?"
        message="This permanently removes WhatsApp conversations from other accounts linked to this store in AiShopy. Chats for your currently connected WhatsApp number are kept. It does not delete chats inside WhatsApp. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={clearingHistory}
        onCancel={() => {
          if (!clearingHistory) setConfirmClearHistory(false)
        }}
        onConfirm={() => {
          void handleClearChatHistory()
        }}
      />
    </main>
  )
}
