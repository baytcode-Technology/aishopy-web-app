'use client'

import { SupportKeyboardChatLayout } from '@/components/support/SupportKeyboardChatLayout'
import { SupportMessageBubble } from '@/components/support/SupportMessageBubble'
import { SupportStatusStrip } from '@/components/support/SupportStatusStrip'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  closeSupportTicket,
  fetchSupportAdminMessages,
  markSupportAdminRead,
  sendSupportAdminReply,
  setSupportReplyMode,
} from '@/core/api/support'
import { getErrorMessage } from '@/core/lib/api-error'
import type { SupportConversation, SupportMessage } from '@/core/types/support'
import { usePlatformAdminBack } from '@/hooks/usePlatformAdminBack'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PlatformSupportDetailPage() {
  const goBack = usePlatformAdminBack()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params.id ? Number(params.id) : NaN
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [storeName, setStoreName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isTakingManual, setIsTakingManual] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const messagesLenRef = useRef(0)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!Number.isFinite(conversationId)) return
    const silent = opts?.silent === true
    if (!silent) {
      setIsLoading(true)
      setError(null)
    }
    try {
      const res = await fetchSupportAdminMessages(conversationId)
      const conv = res.data.conversation
      setConversation(conv)
      setStoreName('store_name' in conv ? String(conv.store_name ?? '') : '')
      setOwnerEmail('owner_email' in conv ? (conv.owner_email as string | null) : null)
      const nextMessages = res.data.messages.map((m) => ({
        ...m,
        time: formatTime(m.created_at),
      }))
      const grew = nextMessages.length > messagesLenRef.current
      messagesLenRef.current = nextMessages.length
      setMessages(nextMessages)
      if (!silent || grew) {
        await markSupportAdminRead(conversationId)
      }
    } catch (e: unknown) {
      if (!silent) setError(getErrorMessage(e, 'Failed to load thread'))
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    void load()
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }, 5000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load({ silent: true })
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [load])

  useEffect(() => {
    if (messages.length === 0) return
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    })
  }, [messages.length, isSending])

  const sendReply = async () => {
    const text = draft.trim()
    if (!text || !Number.isFinite(conversationId) || isSending) return

    setIsSending(true)
    setError(null)
    try {
      const res = await sendSupportAdminReply(conversationId, text)
      const msg = res.data.message
      setMessages((prev) => {
        const next = [...prev, { ...msg, time: formatTime(msg.created_at) }]
        messagesLenRef.current = next.length
        return next
      })
      setDraft('')
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to send reply'))
    } finally {
      setIsSending(false)
    }
  }

  const handleTakeManual = async () => {
    if (!Number.isFinite(conversationId) || isTakingManual) return
    setIsTakingManual(true)
    setError(null)
    try {
      await setSupportReplyMode(conversationId, 'manual')
      await load()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to take over ticket'))
    } finally {
      setIsTakingManual(false)
    }
  }

  const handleConfirmClose = async () => {
    if (!Number.isFinite(conversationId) || isClosing) return
    setIsClosing(true)
    setError(null)
    try {
      await closeSupportTicket(conversationId)
      setShowCloseDialog(false)
      router.back()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to close ticket'))
    } finally {
      setIsClosing(false)
    }
  }

  const isEscalated = conversation?.status === 'escalated'
  const isManual = conversation?.reply_mode === 'manual'
  const canTakeManual = isEscalated && !isManual
  const canReply = isEscalated && isManual
  const canClose = isEscalated

  if (!Number.isFinite(conversationId)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
        <p className="font-semibold text-ink">Conversation not found</p>
        <button type="button" className="mt-4 font-medium text-brand-green" onClick={goBack}>
          Go back
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-100">
      <div className="flex items-center gap-2.5 bg-ink px-3 py-3">
        <button type="button" className="p-1" onClick={goBack} aria-label="Go back">
          <span className="text-brand-on-primary">←</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-brand-on-primary">
            {storeName || 'Support thread'}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {ownerEmail ?? '—'}
            {isEscalated && conversation?.ticket_code ? ` · ${conversation.ticket_code}` : ''}
          </p>
        </div>
      </div>

      <SupportStatusStrip conversation={conversation} />

      {error ? <p className="px-4 py-2 text-sm font-semibold text-[#E11D48]">{error}</p> : null}

      {canTakeManual || canClose ? (
        <div className="flex items-center justify-end gap-2 border-b border-gray-100 bg-surface px-4 py-2.5">
          {canTakeManual ? (
            <button
              type="button"
              onClick={() => void handleTakeManual()}
              disabled={isTakingManual}
              className="rounded-full bg-brand-green px-4 py-2 text-[13px] font-bold text-brand-on-primary disabled:opacity-45"
            >
              {isTakingManual ? 'Taking over…' : 'Take manually'}
            </button>
          ) : null}
          {canClose ? (
            <button
              type="button"
              onClick={() => setShowCloseDialog(true)}
              disabled={isClosing}
              className="rounded-full border border-gray-300 px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-45"
            >
              Close ticket
            </button>
          ) : null}
        </div>
      ) : null}

      <SupportKeyboardChatLayout
        listRef={listRef}
        footer={
          isSending ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
              <p className="text-[13px] text-gray-500">Sending reply…</p>
            </div>
          ) : null
        }
        composer={
          canReply ? (
            <div className="flex items-end gap-2.5 px-3 py-2.5">
              <textarea
                className="max-h-[100px] min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2.5 text-[15px] text-ink outline-none"
                placeholder="Reply as AiShopy team…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                disabled={isSending || isLoading}
                rows={1}
              />
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-brand-on-primary disabled:opacity-45"
                onClick={() => void sendReply()}
                disabled={!draft.trim() || isSending}
                aria-label="Send"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
                </svg>
              </button>
            </div>
          ) : canTakeManual ? (
            <div className="px-4 py-3">
              <p className="text-center text-[13px] text-gray-500">
                Tap Take manually to reply to this ticket.
              </p>
            </div>
          ) : null
        }
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <p className="text-sm text-gray-500">No messages in this thread</p>
          </div>
        ) : (
          <div className="flex-grow p-4 pb-2">
            {messages.map((item) => (
              <SupportMessageBubble key={item.id} message={item} />
            ))}
          </div>
        )}
      </SupportKeyboardChatLayout>

      <ConfirmDialog
        open={showCloseDialog}
        title="Close this ticket?"
        message="Mark this issue as resolved? The merchant can keep chatting with AI in the same thread."
        cancelLabel="No"
        confirmLabel="Yes"
        confirmVariant="primary"
        loading={isClosing}
        onCancel={() => {
          if (!isClosing) setShowCloseDialog(false)
        }}
        onConfirm={() => void handleConfirmClose()}
      />
    </div>
  )
}
