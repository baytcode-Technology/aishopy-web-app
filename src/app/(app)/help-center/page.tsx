'use client'

import { StarterQuestionChips } from '@/components/support/StarterQuestionChips'
import { SupportKeyboardChatLayout } from '@/components/support/SupportKeyboardChatLayout'
import { SupportMessageBubble } from '@/components/support/SupportMessageBubble'
import { SupportStatusStrip } from '@/components/support/SupportStatusStrip'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MenuIcon } from '@/components/ui/MenuIcons'
import {
  closeMerchantSupportTicket,
  escalateSupportConversation,
  fetchSupportMessages,
  getOrCreateSupportConversation,
  sendSupportMessage,
} from '@/core/api/support'
import { getErrorMessage } from '@/core/lib/api-error'
import type { SupportConversation, SupportMessage } from '@/core/types/support'
import { useStore } from '@/providers/store-provider'
import { useSupportUnread } from '@/providers/support-unread-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function mapApiMessage(m: {
  id: number
  conversation_id: number
  role: SupportMessage['role']
  content: string
  created_at: string
}): SupportMessage {
  return {
    ...m,
    time: formatTime(m.created_at),
  }
}

export default function HelpCenterPage() {
  const router = useRouter()
  const { store } = useStore()
  const { markSupportRead, setActiveSupportChat } = useSupportUnread()
  const [conversation, setConversation] = useState<SupportConversation | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isEscalating, setIsEscalating] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [waitingForTeam, setWaitingForTeam] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastAdminMessageIdRef = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const applyMessages = useCallback((nextMessages: SupportMessage[]) => {
    setMessages(nextMessages)
    const lastAdmin = [...nextMessages].reverse().find((m) => m.role === 'admin')
    if (lastAdmin && lastAdmin.id !== lastAdminMessageIdRef.current) {
      lastAdminMessageIdRef.current = lastAdmin.id
      setWaitingForTeam(false)
    }
  }, [])

  const loadConversation = useCallback(async () => {
    if (!store?.id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await getOrCreateSupportConversation(store.id)
      const conv = res.data.conversation
      setConversation(conv)
      setActiveSupportChat(conv.id)
      const msgRes = await fetchSupportMessages(store.id, conv.id)
      applyMessages(msgRes.data.messages.map(mapApiMessage))
      await markSupportRead(conv.id)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load chat'))
    } finally {
      setIsLoading(false)
    }
  }, [store?.id, setActiveSupportChat, markSupportRead, applyMessages])

  useEffect(() => {
    void loadConversation()
    return () => setActiveSupportChat(null)
  }, [loadConversation, setActiveSupportChat])

  useEffect(() => {
    if (!store?.id || !conversation?.id) return
    setActiveSupportChat(conversation.id)
    const refresh = () => {
      void fetchSupportMessages(store.id, conversation.id)
        .then((res) => {
          applyMessages(res.data.messages.map(mapApiMessage))
          setConversation(res.data.conversation)
          void markSupportRead(conversation.id)
        })
        .catch(() => undefined)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      setActiveSupportChat(null)
    }
  }, [store?.id, conversation?.id, setActiveSupportChat, markSupportRead, applyMessages])

  useEffect(() => {
    const isManualEscalated =
      conversation?.status === 'escalated' && conversation?.reply_mode === 'manual'
    if (!store?.id || !conversation?.id || !isManualEscalated) return

    const interval = window.setInterval(() => {
      void fetchSupportMessages(store.id, conversation.id)
        .then((res) => {
          applyMessages(res.data.messages.map(mapApiMessage))
          setConversation(res.data.conversation)
        })
        .catch(() => undefined)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [store?.id, conversation?.id, conversation?.status, conversation?.reply_mode, applyMessages])

  useEffect(() => {
    if (messages.length === 0) return
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight
      }
    })
  }, [messages.length, isSending, waitingForTeam])

  const sendMessage = async (textOverride?: string) => {
    const text = (textOverride ?? draft).trim()
    if (!text || !store?.id || !conversation?.id || isSending) return

    const tempId = -Date.now()
    const now = new Date().toISOString()
    const manualMode =
      conversation.status === 'escalated' && conversation.reply_mode === 'manual'

    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: conversation.id,
        role: 'user',
        content: text,
        created_at: now,
        time: formatTime(now),
      },
    ])
    if (!textOverride) setDraft('')
    setIsSending(true)
    setError(null)

    try {
      const res = await sendSupportMessage(store.id, conversation.id, text)
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        const next = [...withoutTemp, mapApiMessage(res.data.user_message)]
        if (res.data.assistant_message) {
          next.push(mapApiMessage(res.data.assistant_message))
        }
        return next
      })
      if (res.data.conversation) {
        setConversation(res.data.conversation)
      }
      if (manualMode && !res.data.assistant_message) {
        setWaitingForTeam(true)
      }
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      if (!textOverride) setDraft(text)
      setError(getErrorMessage(e, 'Failed to send message'))
    } finally {
      setIsSending(false)
    }
  }

  const handleEscalate = async () => {
    if (!store?.id || !conversation?.id || isEscalating) return
    setIsEscalating(true)
    setError(null)
    try {
      const res = await escalateSupportConversation(store.id, conversation.id)
      setConversation(res.data.conversation)
      const msgRes = await fetchSupportMessages(store.id, conversation.id)
      applyMessages(msgRes.data.messages.map(mapApiMessage))
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to request human support'))
    } finally {
      setIsEscalating(false)
    }
  }

  const handleConfirmClose = async () => {
    if (!store?.id || !conversation?.id || isClosing) return
    setIsClosing(true)
    setError(null)
    try {
      const res = await closeMerchantSupportTicket(store.id, conversation.id)
      setConversation(res.data.conversation)
      const msgRes = await fetchSupportMessages(store.id, conversation.id)
      applyMessages(msgRes.data.messages.map(mapApiMessage))
      setWaitingForTeam(false)
      setShowCloseDialog(false)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to close ticket'))
    } finally {
      setIsClosing(false)
    }
  }

  const canChat = Boolean(conversation?.id) && !isLoading
  const isEscalated = conversation?.status === 'escalated'
  const isManualMode = conversation?.reply_mode === 'manual'
  const showAiTyping = isSending && !isManualMode
  const showTeamTyping = isManualMode && (isSending || waitingForTeam)
  const showTalkWithUs = conversation?.status === 'active'
  const showCloseTicket = isEscalated
  const showStarters = canChat && messages.length === 0 && !isSending

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-gray-100">
      <div className="flex items-center gap-2.5 bg-brand-green px-3 py-3">
        <button
          type="button"
          className="p-1"
          onClick={() => router.push('/inbox')}
          aria-label="Go back"
        >
          <span className="text-brand-on-primary">←</span>
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-brand-on-primary">
          <MenuIcon name="magic" className="h-[18px] w-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-brand-on-primary">Chat with AI</p>
          <p className="mt-0.5 truncate text-xs text-white/80">Ask us anything about AiShopy</p>
        </div>
      </div>

      <SupportStatusStrip conversation={conversation} />

      {error ? <p className="px-4 py-2 text-sm font-semibold text-[#E11D48]">{error}</p> : null}

      <SupportKeyboardChatLayout
        listRef={listRef}
        footer={
          <>
            {showAiTyping ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
                <p className="text-[13px] text-gray-500">AI is typing…</p>
              </div>
            ) : null}
            {showTeamTyping ? (
              <div className="flex items-center gap-2 px-4 py-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
                <p className="text-[13px] text-gray-500">AiShopy team is typing…</p>
              </div>
            ) : null}
            {showStarters ? (
              <StarterQuestionChips disabled={isSending} onSelect={(q) => void sendMessage(q)} />
            ) : null}
            {showTalkWithUs ? (
              <button
                type="button"
                className="mx-3 mb-1 py-2 text-left"
                onClick={() => void handleEscalate()}
                disabled={isEscalating || isLoading}
              >
                <span className="text-[13px] font-bold text-brand-green underline underline-offset-2">
                  {isEscalating ? 'Requesting…' : 'Talk with us'}
                </span>
              </button>
            ) : null}
            {showCloseTicket ? (
              <button
                type="button"
                className="mx-3 mb-1 py-2 text-left"
                onClick={() => setShowCloseDialog(true)}
                disabled={isClosing || isLoading}
              >
                <span className="text-[13px] font-bold text-brand-green underline underline-offset-2">
                  Close ticket
                </span>
              </button>
            ) : null}
          </>
        }
        composer={
          <div className="flex items-end gap-2.5 px-3 py-2.5">
            <textarea
              className="max-h-[100px] min-h-11 flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2.5 text-[15px] text-ink outline-none"
              placeholder="Type your question…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              disabled={!canChat || isSending}
              rows={1}
            />
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-green text-brand-on-primary disabled:opacity-45"
              onClick={() => void sendMessage()}
              disabled={!canChat || isSending}
              aria-label="Send"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 21 23 12 2 3v7l15 2-15 2v7Z" />
              </svg>
            </button>
          </div>
        }
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
            <MenuIcon name="comment-o" className="h-8 w-8 text-brand-green" />
            <p className="mt-4 text-center text-base font-semibold text-ink">Hi! How can we help?</p>
            <p className="mt-2 text-center text-[14px] leading-5 text-gray-500">
              Ask about products, orders, WhatsApp setup, or your subscription plan.
            </p>
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
        message="Mark this issue as resolved? You can keep chatting with AI in the same thread."
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
