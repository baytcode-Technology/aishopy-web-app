'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MenuIcon } from '@/components/ui/MenuIcons'
import {
  clearInstagramChatHistory,
  fetchInstagramConnectionStatus,
  getInstagramConnectUrl,
  subscribeInstagramWebhooks,
  type InstagramConnectionStatus,
} from '@/core/api/instagram-connect'
import { getErrorMessage } from '@/core/lib/api-error'
import { openInstagramAuthSession, persistInstagramOAuthStoreId } from '@/core/lib/instagram-oauth'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type ScreenPhase = 'loading' | 'disconnected' | 'oauth' | 'connected' | 'error'

function formatInstagramHandle(username: string | null | undefined): string | null {
  if (!username?.trim()) return null
  return username.startsWith('@') ? username : `@${username}`
}

function Spinner() {
  return (
    <div
      className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary"
      aria-label="Loading"
    />
  )
}

export default function InstagramConnectPage() {
  const router = useRouter()
  const { store } = useStore()
  const [phase, setPhase] = useState<ScreenPhase>('loading')
  const [connection, setConnection] = useState<InstagramConnectionStatus | null>(null)
  const [subscribing, setSubscribing] = useState(false)
  const [confirmClearHistory, setConfirmClearHistory] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false)
  const [historyCleared, setHistoryCleared] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const oauthRunRef = useRef(0)

  const refreshStatus = useCallback(async () => {
    if (!store?.id) return null
    const res = await fetchInstagramConnectionStatus(store.id)
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
      persistInstagramOAuthStoreId(store.id)
      const res = await getInstagramConnectUrl(store.id)
      const authResult = await openInstagramAuthSession({
        connectUrl: res.data.url,
        pollStatus: refreshStatus,
      })

      if (oauthRunRef.current !== runId) return

      if ('type' in authResult) {
        if (authResult.type === 'cancelled') {
          setPhase('disconnected')
          return
        }

        if (authResult.type === 'dismissed') {
          setPhase('disconnected')
          setError(
            'Connection not finished: Instagram did not return to the app. Tap Connect Instagram to try again.',
          )
          return
        }

        setPhase('disconnected')
        setError(`Connect failed: ${authResult.message}`)
        return
      }

      const status = await refreshStatus()
      setPhase('connected')
      setHistoryCleared(false)

      const handle =
        formatInstagramHandle(authResult.username) ??
        formatInstagramHandle(status?.ig_username) ??
        'Your account'
      setNotice(`Instagram connected — ${handle}`)
    } catch (e: unknown) {
      if (oauthRunRef.current !== runId) return
      setPhase('error')
      setError(getErrorMessage(e, 'Connect failed'))
    }
  }, [store?.id, refreshStatus])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!store?.id) return
      try {
        const status = await refreshStatus()
        if (cancelled) return
        if (status?.connected) {
          setPhase('connected')
        } else {
          setPhase('disconnected')
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setPhase('error')
          setError(getErrorMessage(e, 'Could not load Instagram status'))
        }
      }
    })()

    return () => {
      cancelled = true
      oauthRunRef.current += 1
    }
  }, [store?.id, refreshStatus])

  const handleClearChatHistory = async () => {
    if (!store?.id) return
    setClearingHistory(true)
    try {
      const res = await clearInstagramChatHistory(store.id)
      setHistoryCleared(true)
      setConfirmClearHistory(false)
      setNotice(
        res.data.deletedConversations === 0
          ? 'Chats deleted — No previous Instagram chats to remove'
          : `Chats deleted — ${res.data.deletedConversations} conversation${
              res.data.deletedConversations === 1 ? '' : 's'
            } removed from AiShopy`,
      )
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Could not delete chats'))
    } finally {
      setClearingHistory(false)
    }
  }

  const subtitle =
    phase === 'connected'
      ? connection?.ig_username
        ? `@${connection.ig_username}`
        : 'Connected'
      : phase === 'disconnected'
        ? 'Not connected'
        : 'Link your Instagram business account'

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Connect Instagram"
        subtitle={subtitle}
        onBack={() => router.back()}
        showSettings={false}
      />
      <div className="flex flex-col items-center justify-center gap-6 px-5 pb-10 pt-10">
        {notice ? <p className="w-full text-center text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="w-full text-center text-sm text-[#E11D48]">{error}</p> : null}

        {phase === 'loading' || phase === 'oauth' ? <Spinner /> : null}

        {phase === 'connected' ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 text-brand-primary">
            <MenuIcon name="instagram" className="h-7 w-7" />
          </div>
        ) : null}

        {phase === 'loading' ? (
          <p className="text-center text-[15px] text-gray-500">Checking connection…</p>
        ) : null}

        {phase === 'disconnected' ? (
          <>
            <h2 className="text-center text-xl font-semibold text-ink">Not connected</h2>
            <p className="text-center text-[15px] leading-6 text-gray-500">
              Link your Instagram business account to receive customer DMs in Messages.
            </p>
            <Button label="Connect Instagram" onClick={() => void startOAuth()} />
          </>
        ) : null}

        {phase === 'oauth' ? (
          <p className="text-center text-[15px] text-gray-500">Connecting to Instagram…</p>
        ) : null}

        {phase === 'connected' ? (
          <>
            <h2 className="text-center text-xl font-semibold text-ink">Instagram connected</h2>
            <p className="text-center text-[15px] text-gray-500">
              {connection?.ig_username
                ? `Your business account @${connection.ig_username} is linked.`
                : 'Your Instagram business account is linked.'}
            </p>
            <p className="text-center text-[15px] leading-6 text-gray-500">
              Customer DMs appear in Messages after they message you — not messages you send out.
            </p>
            <p className="text-center text-[15px] leading-6 text-gray-500">
              Chat Boat auto-replies on Instagram are text and product links only. Product photos are
              sent automatically on WhatsApp, not in Instagram DMs.
            </p>
            <Button
              label={subscribing ? 'Enabling DMs…' : 'Enable DM notifications'}
              variant="outline"
              disabled={subscribing}
              onClick={() => {
                void (async () => {
                  if (!store?.id) return
                  setSubscribing(true)
                  setError(null)
                  try {
                    await subscribeInstagramWebhooks(store.id)
                    const handle = formatInstagramHandle(connection?.ig_username)
                    setNotice(
                      handle
                        ? `DMs enabled — Ask someone to DM ${handle}, then check Messages`
                        : 'DMs enabled — Ask someone to DM your business account, then check Messages',
                    )
                  } catch (e: unknown) {
                    setError(getErrorMessage(e, 'Could not enable DMs'))
                  } finally {
                    setSubscribing(false)
                  }
                })()
              }}
            />
            <Button label="Reconnect account" variant="outline" onClick={() => void startOAuth()} />
            {!historyCleared ? (
              <Button
                label="Delete previous account chats"
                variant="outline"
                onClick={() => setConfirmClearHistory(true)}
              />
            ) : (
              <p className="text-center text-[15px] text-gray-500">Previous account chats deleted</p>
            )}
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
      </div>

      <ConfirmDialog
        open={confirmClearHistory}
        title="Delete previous account chats?"
        message="This permanently removes Instagram conversations from other accounts linked to this store in AiShopy. Chats for your currently connected Instagram account are kept. It does not delete chats inside Instagram. This cannot be undone."
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
