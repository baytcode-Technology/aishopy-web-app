'use client'

import {
  ChatComposer,
  type OutboundMediaPayload,
} from '@/components/chat/ChatComposer'
import { ChatDateSeparator } from '@/components/chat/ChatDateSeparator'
import { ChatMessageActionsSheet } from '@/components/chat/ChatMessageActionsSheet'
import {
  ChatProductSendModal,
  type ProductShareSendPayload,
} from '@/components/chat/ChatProductSendModal'
import { ForwardMessageModal } from '@/components/chat/ForwardMessageModal'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { HeaderOverflow } from '@/components/catalog/HeaderOverflow'
import { SettingsHeaderButton } from '@/components/catalog/SettingsHeaderButton'
import { SupportKeyboardChatLayout } from '@/components/support/SupportKeyboardChatLayout'
import { MenuIcon } from '@/components/ui/MenuIcons'
import {
  fetchChatMessages,
  fetchInstagramMessages,
  forwardInstagramMessage,
  forwardWhatsAppMessage,
  mapApiMessageToChatMessage,
  mapSocketMessageToChatMessage,
  sendChatMessage,
  sendInstagramMediaMessage,
  sendWhatsAppMediaMessage,
  uploadInstagramMedia,
  uploadWhatsAppMedia,
} from '@/core/api/chats'
import { setChatReplyMode } from '@/core/api/inbox-ai'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  dateLabelFromTimestamp,
  injectChatDateSeparators,
  isDateSeparatorItem,
  stickyDateLabelFromTopVisibleItems,
} from '@/core/lib/chat-date-separators'
import { isAiPaused } from '@/core/lib/inbox-ai'
import { prepareWhatsAppMessagesForDisplay } from '@/core/lib/prepare-whatsapp-messages'
import { toSocketId } from '@/core/lib/socket-normalize'
import { hasPremiumAccess } from '@/core/lib/subscription'
import type { ChatChannel, ChatMessage } from '@/core/types/chat'
import { useChatSocket } from '@/providers/chat-socket-provider'
import { ChatVoicePlayerProvider } from '@/providers/chat-voice-player-provider'
import { useChatVoiceRecording } from '@/providers/chat-voice-recording-provider'
import { useChatsUnread } from '@/providers/chats-unread-provider'
import { useStore } from '@/providers/store-provider'
import { useAppTheme } from '@/providers/theme-provider'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from 'react'

function dedupeByIdAndMeta(list: ChatMessage[]): ChatMessage[] {
  const seen = new Set<string>()
  const out: ChatMessage[] = []

  for (const m of list) {
    const key = m.metaMessageId
      ? `meta:${m.metaMessageId}`
      : m.clientKey
        ? `client:${m.clientKey}`
        : `id:${m.id}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(m)
  }

  return out
}

function mergeMessageLists(current: ChatMessage[], fetched: ChatMessage[]): ChatMessage[] {
  const merged = dedupeByIdAndMeta([...current, ...fetched])
  return merged.sort((a, b) => {
    const ta = a.timestamp ? Date.parse(a.timestamp) : 0
    const tb = b.timestamp ? Date.parse(b.timestamp) : 0
    return tb - ta
  })
}

function mimeFromImageUrl(url: string): { mimeType: string; ext: string } {
  const lower = url.split('?')[0]?.toLowerCase() ?? ''
  if (lower.endsWith('.png')) return { mimeType: 'image/png', ext: 'png' }
  if (lower.endsWith('.webp')) return { mimeType: 'image/webp', ext: 'webp' }
  if (lower.endsWith('.gif')) return { mimeType: 'image/gif', ext: 'gif' }
  return { mimeType: 'image/jpeg', ext: 'jpg' }
}

function patchOutgoingWithServer(existing: ChatMessage, server: ChatMessage): ChatMessage {
  return {
    ...existing,
    id: server.id,
    metaMessageId: server.metaMessageId ?? existing.metaMessageId,
    type: server.type ?? existing.type,
    text: server.text,
    time: server.time || existing.time,
    timestamp: server.timestamp ?? existing.timestamp,
    status: server.status ?? 'sent',
    pending: false,
    mediaId: server.mediaId ?? existing.mediaId,
    mimeType: server.mimeType ?? existing.mimeType,
    caption: server.caption ?? existing.caption,
    mediaUrl: server.mediaUrl ?? existing.mediaUrl,
    clientKey: existing.clientKey,
  }
}

const INITIAL_MESSAGE_LIMIT = 20
const MESSAGE_PAGE_SIZE = 25

function InboxThreadPageInner() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const { store } = useStore()
  const { isDark } = useAppTheme()
  const { markChatRead, setActiveChat, isActiveChat } = useChatsUnread()
  const { pauseRecording } = useChatVoiceRecording()
  const {
    onMessageNew,
    onMessageStatus,
    onInstagramMessageNew,
    onInboxAiTyping,
    onConversationUpdated,
    onInstagramConversationUpdated,
  } = useChatSocket()

  const conversationId = Number(params.id)
  const customerPhone = searchParams.get('phone') ?? ''
  const channel: ChatChannel = searchParams.get('channel') === 'instagram' ? 'instagram' : 'whatsapp'
  const displayName = searchParams.get('displayName')
  const unreadRaw = searchParams.get('unread') ?? '0'
  const replyModeParam = searchParams.get('replyMode')
  const aiPausedUntilParam = searchParams.get('aiPausedUntil')

  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingMedia, setIsSendingMedia] = useState(false)
  const [actionsMessage, setActionsMessage] = useState<ChatMessage | null>(null)
  const [actionsVisible, setActionsVisible] = useState(false)
  const [forwardMessage, setForwardMessage] = useState<ChatMessage | null>(null)
  const [forwardVisible, setForwardVisible] = useState(false)
  const [productPickerOpen, setProductPickerOpen] = useState(false)
  const [replyMode, setReplyMode] = useState<'ai' | 'manual'>(
    replyModeParam === 'manual' ? 'manual' : 'ai',
  )
  const initialAiPausedUntil = aiPausedUntilParam?.trim() ? aiPausedUntilParam : null
  const [aiPausedUntil, setAiPausedUntil] = useState<string | null>(initialAiPausedUntil)
  const [customerDisplayName, setCustomerDisplayName] = useState<string | null>(
    displayName?.trim() || null,
  )
  const [replyModeBusy, setReplyModeBusy] = useState(false)
  const [aiPreparingReply, setAiPreparingReply] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [stickyDateLabel, setStickyDateLabel] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottomRef = useRef(true)
  const initialLoadDoneRef = useRef(false)
  const loadGenerationRef = useRef(0)
  const clientKeyCounterRef = useRef(0)
  const markReadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scheduleMarkReadRef = useRef<() => void>(() => {})
  const aiPreparingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const unreadCount = Number.isFinite(Number(unreadRaw)) && Number(unreadRaw) > 0 ? Number(unreadRaw) : 0
  const initialLimit = Math.max(INITIAL_MESSAGE_LIMIT, unreadCount)
  const headerLabel = displayName?.trim() || customerPhone

  const scrollToBottom = useCallback(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const triggerAutoScroll = useCallback(() => {
    stickToBottomRef.current = true
    requestAnimationFrame(scrollToBottom)
  }, [scrollToBottom])

  useEffect(() => {
    if (store && !hasPremiumAccess(store)) {
      router.replace('/subscription')
    }
  }, [store, router])

  const chatBoatActive =
    hasPremiumAccess(store) &&
    store?.ai_auto_reply_enabled === true &&
    replyMode === 'ai' &&
    !isAiPaused(aiPausedUntil)

  const aiPausedWhileAuto =
    hasPremiumAccess(store) &&
    store?.ai_auto_reply_enabled === true &&
    replyMode === 'ai' &&
    isAiPaused(aiPausedUntil)

  const toggleReplyMode = async (mode: 'ai' | 'manual') => {
    if (!store?.id) return
    setReplyModeBusy(true)
    try {
      await setChatReplyMode({
        channel,
        storeId: store.id,
        conversationId,
        replyMode: mode,
      })
      setReplyMode(mode)
      if (mode === 'ai') {
        setAiPausedUntil(null)
      } else {
        setAiPreparingReply(false)
      }
    } catch (e) {
      setNotice(getErrorMessage(e, 'Could not update reply mode'))
    } finally {
      setReplyModeBusy(false)
    }
  }

  useEffect(() => {
    setReplyMode(replyModeParam === 'manual' ? 'manual' : 'ai')
    setAiPausedUntil(initialAiPausedUntil)
    setCustomerDisplayName(displayName?.trim() || null)
  }, [conversationId, replyModeParam, initialAiPausedUntil, displayName])

  useEffect(() => {
    if (!Number.isFinite(conversationId)) return

    const syncConversationState = (payload: {
      conversation: {
        id: number
        reply_mode?: 'ai' | 'manual'
        ai_paused_until?: string | null
        customer_ig_username?: string | null
      }
    }) => {
      if (toSocketId(payload.conversation.id) !== conversationId) return
      if (payload.conversation.reply_mode) {
        setReplyMode(payload.conversation.reply_mode)
      }
      if (payload.conversation.ai_paused_until !== undefined) {
        setAiPausedUntil(payload.conversation.ai_paused_until)
      }
      const username = payload.conversation.customer_ig_username?.trim()
      if (username) {
        setCustomerDisplayName(`@${username.replace(/^@/, '')}`)
      }
    }

    const unsubWa = onConversationUpdated(syncConversationState)
    const unsubIg = onInstagramConversationUpdated(syncConversationState)
    return () => {
      unsubWa()
      unsubIg()
    }
  }, [conversationId, onConversationUpdated, onInstagramConversationUpdated])

  const title = useMemo(() => {
    if (channel === 'instagram') {
      const label = customerDisplayName?.trim() || headerLabel.trim()
      if (label) {
        if (label.startsWith('@')) return label
        if (!/^\d+$/.test(label)) return label
      }
      const igId = customerPhone.trim()
      if (!igId) return 'Instagram'
      return igId.length > 12 ? `IG ${igId.slice(0, 8)}…` : igId
    }
    return customerDisplayName || headerLabel || customerPhone || 'Chat'
  }, [channel, customerDisplayName, customerPhone, headerLabel])

  const instagramSubtitle = useMemo(() => {
    const label = customerDisplayName?.trim() || headerLabel.trim()
    if (label.startsWith('@')) return label
    return 'Instagram DM'
  }, [customerDisplayName, headerLabel])

  const loadMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!store?.id || !Number.isFinite(conversationId)) return
      const silent = options?.silent ?? false
      const isInitialLoad = !silent && !initialLoadDoneRef.current
      const limit = isInitialLoad ? initialLimit : MESSAGE_PAGE_SIZE
      const generation = ++loadGenerationRef.current

      if (!silent) {
        setIsLoading(true)
        stickToBottomRef.current = true
      }
      try {
        const res =
          channel === 'instagram'
            ? await fetchInstagramMessages({ storeId: store.id, conversationId, limit })
            : await fetchChatMessages({ storeId: store.id, conversationId, limit })
        if (generation !== loadGenerationRef.current) return

        const mapped = res.data.messages.map((m) => mapApiMessageToChatMessage(m, store.id))
        setMessages((prev) => {
          const nextMessages = silent ? mergeMessageLists(prev, mapped) : mapped
          return channel === 'whatsapp'
            ? prepareWhatsAppMessagesForDisplay(nextMessages)
            : nextMessages
        })
        setNextCursor(res.data.nextCursor)
        setHasMore(res.data.messages.length >= limit && Boolean(res.data.nextCursor))
        if (isInitialLoad) initialLoadDoneRef.current = true
      } catch (e: unknown) {
        if (!silent) setNotice(getErrorMessage(e, 'Failed to load messages'))
      } finally {
        if (!silent && generation === loadGenerationRef.current) {
          setIsLoading(false)
        }
      }
    },
    [store?.id, conversationId, channel, initialLimit],
  )

  const loadOlderMessages = useCallback(async () => {
    if (!store?.id || !Number.isFinite(conversationId) || !nextCursor || loadingMore || !hasMore) {
      return
    }

    const el = listRef.current
    const previousHeight = el?.scrollHeight ?? 0
    setLoadingMore(true)
    stickToBottomRef.current = false

    try {
      const res =
        channel === 'instagram'
          ? await fetchInstagramMessages({
              storeId: store.id,
              conversationId,
              limit: MESSAGE_PAGE_SIZE,
              cursor: nextCursor,
            })
          : await fetchChatMessages({
              storeId: store.id,
              conversationId,
              limit: MESSAGE_PAGE_SIZE,
              cursor: nextCursor,
            })

      const older = res.data.messages.map((m) => mapApiMessageToChatMessage(m, store.id))
      setMessages((prev) => {
        const merged = dedupeByIdAndMeta([...prev, ...older])
        return channel === 'whatsapp' ? prepareWhatsAppMessagesForDisplay(merged) : merged
      })
      setNextCursor(res.data.nextCursor)
      setHasMore(res.data.messages.length >= MESSAGE_PAGE_SIZE && Boolean(res.data.nextCursor))
      requestAnimationFrame(() => {
        if (!el) return
        el.scrollTop = el.scrollHeight - previousHeight
      })
    } catch (e: unknown) {
      setNotice(getErrorMessage(e, 'Failed to load older messages'))
    } finally {
      setLoadingMore(false)
    }
  }, [store?.id, conversationId, channel, nextCursor, loadingMore, hasMore])

  useEffect(() => {
    initialLoadDoneRef.current = false
    void loadMessages()
  }, [loadMessages])

  const scheduleMarkRead = useCallback(() => {
    if (!isActiveChat(conversationId, channel)) return
    if (markReadTimerRef.current) clearTimeout(markReadTimerRef.current)
    markReadTimerRef.current = setTimeout(() => {
      markReadTimerRef.current = null
      if (!isActiveChat(conversationId, channel)) return
      void markChatRead(conversationId, channel)
    }, 500)
  }, [conversationId, channel, markChatRead, isActiveChat])

  scheduleMarkReadRef.current = scheduleMarkRead

  useEffect(() => {
    if (!Number.isFinite(conversationId)) return
    setActiveChat({ conversationId, channel })
    scheduleMarkReadRef.current()
    return () => {
      void pauseRecording(conversationId)
      setActiveChat(null)
      if (markReadTimerRef.current) {
        clearTimeout(markReadTimerRef.current)
        markReadTimerRef.current = null
      }
    }
  }, [conversationId, channel, setActiveChat, pauseRecording])

  useEffect(() => {
    if (!Number.isFinite(conversationId)) return

    const handleNew = (payload: {
      conversationId: number
      message: {
        id: number
        meta_message_id?: string
        direction: string
        type: string
        text_body: string | null
        status: string
        timestamp: string | null
      }
    }) => {
      if (toSocketId(payload.conversationId) !== conversationId || !store?.id) return
      setMessages((prev) => {
        const incoming = mapSocketMessageToChatMessage(payload.message, store.id)
        if (
          prev.some(
            (m) =>
              m.id === incoming.id ||
              (incoming.metaMessageId &&
                m.metaMessageId === incoming.metaMessageId &&
                incoming.type !== 'reaction'),
          )
        ) {
          return prev
        }
        if (incoming.outgoing) {
          const pendingIdx = prev.findIndex((m) => m.pending && m.text === incoming.text && m.outgoing)
          if (pendingIdx !== -1) {
            const patched = patchOutgoingWithServer(prev[pendingIdx], incoming)
            const next = [...prev]
            next[pendingIdx] = patched
            return channel === 'whatsapp' ? prepareWhatsAppMessagesForDisplay(next) : next
          }
        }
        const next = dedupeByIdAndMeta([incoming, ...prev])
        return channel === 'whatsapp' ? prepareWhatsAppMessagesForDisplay(next) : next
      })
      triggerAutoScroll()
      if (payload.message.direction === 'inbound') {
        scheduleMarkReadRef.current()
        setAiPausedUntil(null)
      }
      if (payload.message.direction === 'outbound') {
        setAiPreparingReply(false)
      }
    }

    const unsubWa = onMessageNew(handleNew)
    const unsubIg = onInstagramMessageNew(handleNew)
    const unsubStatus = onMessageStatus((payload) => {
      if (toSocketId(payload.conversationId) !== conversationId) return
      setMessages((prev) =>
        prev.map((m) =>
          m.metaMessageId === payload.metaMessageId
            ? { ...m, status: payload.status as ChatMessage['status'], pending: false }
            : m,
        ),
      )
    })

    return () => {
      unsubWa()
      unsubIg()
      unsubStatus()
    }
  }, [
    conversationId,
    store?.id,
    channel,
    onMessageNew,
    onInstagramMessageNew,
    onMessageStatus,
    triggerAutoScroll,
  ])

  useEffect(() => {
    if (!Number.isFinite(conversationId) || !store?.id) return
    const unsub = onInboxAiTyping((payload) => {
      if (payload.storeId !== store.id) return
      if (toSocketId(payload.conversationId) !== conversationId) return
      if (payload.channel !== channel) return
      if (aiPreparingTimeoutRef.current) {
        clearTimeout(aiPreparingTimeoutRef.current)
        aiPreparingTimeoutRef.current = null
      }
      setAiPreparingReply(payload.typing)
      if (payload.typing) {
        aiPreparingTimeoutRef.current = setTimeout(() => {
          setAiPreparingReply(false)
          aiPreparingTimeoutRef.current = null
        }, 45_000)
      }
    })
    return () => {
      unsub()
      if (aiPreparingTimeoutRef.current) {
        clearTimeout(aiPreparingTimeoutRef.current)
        aiPreparingTimeoutRef.current = null
      }
    }
  }, [channel, conversationId, onInboxAiTyping, store?.id])

  const previewForMediaType = (type: OutboundMediaPayload['type'], caption?: string) => {
    if (caption?.trim()) return caption.trim()
    if (type === 'image') return 'Photo'
    if (type === 'video') return 'Video'
    return 'Voice message'
  }

  const sendOneMediaMessage = async (payload: OutboundMediaPayload, tempIdOffset = 0) => {
    const tempId = -(Date.now() + tempIdOffset)
    const clientKey = `client-${tempId}`
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    setMessages((prev) => [
      {
        id: tempId,
        clientKey,
        type: payload.type,
        text: previewForMediaType(payload.type, payload.caption),
        caption: payload.caption,
        mediaUrl: payload.uri,
        mimeType: payload.mimeType,
        time,
        timestamp: now.toISOString(),
        outgoing: true,
        status: 'pending',
        pending: true,
      },
      ...prev,
    ])
    requestAnimationFrame(triggerAutoScroll)

    try {
      if (channel === 'instagram') {
        const uploaded = await uploadInstagramMedia({
          storeId: store!.id,
          kind: payload.type,
          file: payload.file,
        })
        const res = await sendInstagramMediaMessage({
          storeId: store!.id,
          to: customerPhone,
          conversationId,
          type: payload.type,
          mediaUrl: uploaded.data.media_url,
          mimeType: uploaded.data.mime_type,
          caption: payload.caption,
        })
        const serverMessage = mapApiMessageToChatMessage(res.data.message, store!.id)
        setMessages((prev) =>
          dedupeByIdAndMeta(
            prev.map((m) =>
              m.clientKey === clientKey
                ? patchOutgoingWithServer(m, {
                    ...serverMessage,
                    mediaUrl: serverMessage.mediaUrl ?? uploaded.data.media_url,
                  })
                : m,
            ),
          ),
        )
      } else {
        const uploaded = await uploadWhatsAppMedia({
          storeId: store!.id,
          kind: payload.type,
          file: payload.file,
          voice: payload.voice,
        })
        const res = await sendWhatsAppMediaMessage({
          storeId: store!.id,
          to: customerPhone,
          conversationId,
          type: payload.type,
          mediaId: uploaded.data.media_id,
          mimeType: uploaded.data.mime_type,
          caption: payload.caption,
          voice: payload.voice === true,
        })
        const serverMessage = mapApiMessageToChatMessage(res.data.message, store!.id)
        setMessages((prev) =>
          dedupeByIdAndMeta(
            prev.map((m) =>
              m.clientKey === clientKey ? patchOutgoingWithServer(m, serverMessage) : m,
            ),
          ),
        )
      }
    } catch (e: unknown) {
      setMessages((prev) => prev.filter((m) => m.clientKey !== clientKey))
      setNotice(getErrorMessage(e, 'Failed to send media'))
      throw e
    }
  }

  const sendMediaMessage = async (payload: OutboundMediaPayload | OutboundMediaPayload[]) => {
    if (!store?.id || isSendingMedia) return
    const payloads = Array.isArray(payload) ? payload : [payload]
    if (!payloads.length) return
    setIsSendingMedia(true)
    try {
      for (let i = 0; i < payloads.length; i++) {
        await sendOneMediaMessage(payloads[i], i)
      }
    } finally {
      setIsSendingMedia(false)
    }
  }

  const sendTextMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || !store?.id) return
      clientKeyCounterRef.current += 1
      const tempId = -(Date.now() + clientKeyCounterRef.current)
      const clientKey = `client-${tempId}`
      const now = new Date()
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      setMessages((prev) => [
        {
          id: tempId,
          clientKey,
          text: trimmed,
          time,
          timestamp: now.toISOString(),
          outgoing: true,
          status: 'pending',
          pending: true,
        },
        ...prev,
      ])
      requestAnimationFrame(triggerAutoScroll)

      try {
        const res = await sendChatMessage({
          storeId: store.id,
          to: customerPhone,
          message: trimmed,
          conversationId,
          channel,
        })
        const serverMessage = mapApiMessageToChatMessage(res.data.message, store.id)
        setMessages((prev) =>
          dedupeByIdAndMeta(
            prev.map((m) =>
              m.clientKey === clientKey ? patchOutgoingWithServer(m, serverMessage) : m,
            ),
          ),
        )
      } catch (e: unknown) {
        setMessages((prev) => prev.filter((m) => m.clientKey !== clientKey))
        setNotice(getErrorMessage(e, 'Failed to send'))
        throw e
      }
    },
    [store?.id, customerPhone, conversationId, channel, triggerAutoScroll],
  )

  const sendProductShare = async (payload: ProductShareSendPayload) => {
    const { text, imageUrl } = payload
    if (!imageUrl?.trim()) {
      await sendTextMessage(text)
      return
    }
    const { mimeType, ext } = mimeFromImageUrl(imageUrl)
    try {
      const res = await fetch(imageUrl.trim())
      const blob = await res.blob()
      const file = new File([blob], `product-share.${ext}`, { type: mimeType })
      await sendMediaMessage({
        type: 'image',
        uri: URL.createObjectURL(file),
        file,
        name: file.name,
        mimeType,
        caption: text,
      })
    } catch (e: unknown) {
      setNotice(getErrorMessage(e, 'Failed to send product image'))
      throw e
    }
  }

  const displayItems = useMemo(
    () => [...injectChatDateSeparators(messages)].reverse(),
    [messages],
  )
  const displayItemsRef = useRef(displayItems)
  displayItemsRef.current = displayItems

  const updateStickyDate = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const pane = el.getBoundingClientRect()
    const nodes = el.querySelectorAll('[data-thread-index]')
    const viewable: { index: number; item: (typeof displayItems)[number] }[] = []
    nodes.forEach((node) => {
      const rect = node.getBoundingClientRect()
      if (rect.bottom > pane.top && rect.top < pane.bottom) {
        const index = Number(node.getAttribute('data-thread-index'))
        const item = displayItemsRef.current[index]
        if (Number.isFinite(index) && item) viewable.push({ index, item })
      }
    })
    const label = stickyDateLabelFromTopVisibleItems(viewable)
    if (label) setStickyDateLabel(label)
  }, [])

  const handleListScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      const el = event.currentTarget
      stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
      if (el.scrollTop < 80) void loadOlderMessages()
      updateStickyDate()
    },
    [loadOlderMessages, updateStickyDate],
  )

  useEffect(() => {
    setStickyDateLabel(dateLabelFromTimestamp(messages[0]?.timestamp ?? null))
  }, [messages])

  useEffect(() => {
    if (stickToBottomRef.current) requestAnimationFrame(scrollToBottom)
    requestAnimationFrame(updateStickyDate)
  }, [displayItems.length, scrollToBottom, updateStickyDate])

  if (!Number.isFinite(conversationId)) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center bg-gray-100">
        <p className="mt-10 text-center font-semibold text-ink">Conversation not found</p>
        <Link href="/inbox" className="mt-4 font-semibold text-brand-primary">
          Go back
        </Link>
      </div>
    )
  }

  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return
    setDraft('')
    void sendTextMessage(text).catch(() => setDraft(text))
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-100">
      <div
        className={`flex shrink-0 items-center gap-2.5 px-3 py-3 ${isDark ? 'bg-charcoal' : 'bg-brand-primary'}`}
      >
        <button type="button" onClick={() => router.push('/inbox')} className="p-1" aria-label="Go back">
          <span className={isDark ? 'text-white' : 'text-brand-on-primary'}>←</span>
        </button>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: channel === 'instagram' ? '#E1306C' : '#25D366' }}
        >
          <MenuIcon
            name={channel === 'instagram' ? 'instagram' : 'whatsapp'}
            className="h-[18px] w-[18px] text-white"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-base font-bold ${
              isDark ? 'text-white' : 'text-brand-on-primary'
            }`}
          >
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-400">
            {isLoading ? 'Loading…' : channel === 'instagram' ? instagramSubtitle : customerPhone}
          </p>
        </div>
        <SettingsHeaderButton />
        <HeaderOverflow />
      </div>

      {notice ? (
        <p className="px-4 py-2 text-sm font-semibold text-[#E11D48]">{notice}</p>
      ) : null}

      {chatBoatActive ? (
        <div className="flex items-center justify-between border-b border-emerald-100 bg-emerald-50 px-3 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <MenuIcon name="magic" className="h-3.5 w-3.5 text-brand-primary" />
            <p className="flex-1 truncate text-sm font-medium text-emerald-900">
              Chat Boat is replying automatically
            </p>
          </div>
          <button
            type="button"
            disabled={replyModeBusy}
            onClick={() => void toggleReplyMode('manual')}
            className="rounded-full border border-emerald-200 bg-surface px-3 py-1.5 text-xs font-semibold text-emerald-800"
          >
            Take over
          </button>
        </div>
      ) : null}

      {aiPausedWhileAuto ? (
        <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-3 py-2">
          <p className="flex-1 text-sm font-medium text-amber-900">AI paused — tap Resume AI</p>
          <button
            type="button"
            disabled={replyModeBusy}
            onClick={() => void toggleReplyMode('ai')}
            className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-on-primary"
          >
            Resume AI
          </button>
        </div>
      ) : null}

      {!chatBoatActive &&
      !aiPausedWhileAuto &&
      store?.ai_auto_reply_enabled &&
      replyMode === 'manual' &&
      hasPremiumAccess(store) ? (
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2">
          <p className="flex-1 text-sm text-gray-600">You are replying manually</p>
          <button
            type="button"
            disabled={replyModeBusy}
            onClick={() => void toggleReplyMode('ai')}
            className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-semibold text-brand-on-primary"
          >
            Resume AI
          </button>
        </div>
      ) : null}

      <SupportKeyboardChatLayout
        listRef={listRef}
        onScroll={handleListScroll}
        onKeyboardShow={scrollToBottom}
        overlay={
          <>
            {stickyDateLabel ? (
              <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex justify-center pt-2">
                <ChatDateSeparator label={stickyDateLabel} variant="sticky" />
              </div>
            ) : null}
            {loadingMore ? (
              <div className="absolute left-0 right-0 top-0 z-10 flex justify-center py-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              </div>
            ) : null}
          </>
        }
        footer={
          (chatBoatActive || aiPausedWhileAuto) && aiPreparingReply ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
              <p className="text-[13px] text-gray-500">AI is preparing a reply…</p>
            </div>
          ) : null
        }
        composer={
          <ChatComposer
            conversationId={conversationId}
            draft={draft}
            onChangeDraft={setDraft}
            onSendText={() => void sendMessage()}
            onSendMedia={sendMediaMessage}
            onOpenProductPicker={store?.slug ? () => setProductPickerOpen(true) : undefined}
            channel={channel}
            onError={setNotice}
          />
        }
      >
        <div className="flex w-full flex-col px-4 pb-3 pt-10">
          {displayItems.map((item, index) =>
            isDateSeparatorItem(item) ? (
              <div key={item.id} data-thread-index={index} className="flex w-full justify-center">
                <ChatDateSeparator label={item.label} />
              </div>
            ) : (
              <div
                key={item.clientKey ?? String(item.id)}
                data-thread-index={index}
                className="flex w-full flex-col"
              >
                <MessageBubble
                  message={item}
                  storeId={store?.id}
                  onLongPress={(message) => {
                    setActionsMessage(message)
                    setActionsVisible(true)
                  }}
                  onForward={(message) => {
                    setForwardMessage(message)
                    setForwardVisible(true)
                  }}
                />
              </div>
            ),
          )}
        </div>
      </SupportKeyboardChatLayout>

      <ChatMessageActionsSheet
        visible={actionsVisible}
        message={actionsMessage}
        onClose={() => {
          setActionsVisible(false)
          setActionsMessage(null)
        }}
        onForward={(message) => {
          setForwardMessage(message)
          setForwardVisible(true)
        }}
      />

      {store?.id ? (
        <ForwardMessageModal
          visible={forwardVisible}
          storeId={store.id}
          sourceConversationId={conversationId}
          channel={channel}
          message={forwardMessage}
          onClose={() => {
            setForwardVisible(false)
            setForwardMessage(null)
          }}
          onForward={async ({ targetConversationId }) => {
            if (!forwardMessage) return
            if (channel === 'instagram') {
              await forwardInstagramMessage({
                storeId: store.id,
                sourceMessageId: forwardMessage.id,
                targetConversationId,
              })
              return
            }
            await forwardWhatsAppMessage({
              storeId: store.id,
              sourceMessageId: forwardMessage.id,
              targetConversationId,
            })
          }}
        />
      ) : null}

      {store?.id && store.slug ? (
        <ChatProductSendModal
          visible={productPickerOpen}
          storeId={store.id}
          storeSlug={store.slug}
          currency={store.currency}
          onClose={() => setProductPickerOpen(false)}
          onSend={(payload) => void sendProductShare(payload)}
        />
      ) : null}
    </div>
  )
}

export default function InboxThreadPage() {
  return (
    <ChatVoicePlayerProvider>
      <InboxThreadPageInner />
    </ChatVoicePlayerProvider>
  )
}
