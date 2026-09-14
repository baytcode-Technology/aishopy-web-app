import { env } from '@/core/config/env'
import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null
let joinedStoreId: number | null = null
let joinRetryTimer: ReturnType<typeof setTimeout> | null = null

function clearJoinRetryTimer(): void {
  if (joinRetryTimer) {
    clearTimeout(joinRetryTimer)
    joinRetryTimer = null
  }
}

export function getJoinedStoreId(): number | null {
  return joinedStoreId
}

export function isChatSocketConnected(): boolean {
  return Boolean(socket?.connected)
}

export const SOCKET_EVENTS = {
  JOIN_STORE: 'store:join',
  STORE_JOINED: 'store:joined',
  MESSAGE_NEW: 'whatsapp:message:new',
  MESSAGE_STATUS: 'whatsapp:message:status',
  CONVERSATION_UPDATED: 'whatsapp:conversation:updated',
  INSTAGRAM_MESSAGE_NEW: 'instagram:message:new',
  INSTAGRAM_CONVERSATION_UPDATED: 'instagram:conversation:updated',
  ORDER_NEW: 'order:new',
  INBOX_AI_TYPING: 'inbox-ai:typing',
} as const

export type SocketMessagePayload = {
  storeId: number
  conversationId: number
  message: {
    id: number
    meta_message_id: string
    direction: string
    type: string
    text_body: string | null
    media_id?: string | null
    mime_type?: string | null
    caption?: string | null
    raw_payload?: unknown
    status: string
    timestamp: string | null
    from_number: string
    to_number: string
  }
}

export type SocketStatusPayload = {
  storeId: number
  conversationId: number
  metaMessageId: string
  status: string
}

export type SocketConversationPayload = {
  storeId: number
  conversation: {
    id: number
    customer_wa_number: string
    last_message_at: string | null
    last_message_preview: string | null
    unread_count: number
    reply_mode?: 'ai' | 'manual'
    ai_paused_until?: string | null
  }
}

export type SocketInstagramMessagePayload = {
  storeId: number
  conversationId: number
  message: {
    id: number
    meta_message_id: string
    direction: string
    type: string
    text_body: string | null
    media_id?: string | null
    media_url?: string | null
    mime_type?: string | null
    caption?: string | null
    status: string
    timestamp: string | null
    from_ig_id: string
    to_ig_id: string
  }
}

export type SocketInstagramConversationPayload = {
  storeId: number
  conversation: {
    id: number
    customer_ig_id: string
    customer_ig_username: string | null
    last_message_at: string | null
    last_message_preview: string | null
    unread_count: number
    reply_mode?: 'ai' | 'manual'
    ai_paused_until?: string | null
  }
}

export type SocketOrderNewPayload = {
  storeId: number
  order: {
    id: number
    order_number: string
    total: number
    currency: string
    source: string
    store_slug: string
    item_quantity?: number
  }
}

export type SocketInboxAiTypingPayload = {
  storeId: number
  conversationId: number
  channel: 'whatsapp' | 'instagram'
  typing: boolean
}

export function getChatSocket(): Socket | null {
  return socket
}

export function connectChatSocket(token: string): Socket {
  clearJoinRetryTimer()
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  joinedStoreId = null

  socket = io(env.apiBaseUrl.replace(/\/$/, ''), {
    transports: ['websocket', 'polling'],
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
  })

  return socket
}

export function reconnectChatSocket(token: string): Socket {
  return connectChatSocket(token)
}

export function disconnectChatSocket(): void {
  clearJoinRetryTimer()
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
  joinedStoreId = null
}

export function joinStoreRoom(storeId: number): void {
  if (!socket?.connected) return
  socket.emit(SOCKET_EVENTS.JOIN_STORE, { storeId })
}

export function scheduleStoreRoomJoin(storeId: number, attempts = 8): void {
  clearJoinRetryTimer()

  const attemptJoin = (remaining: number) => {
    if (!socket?.connected) return
    if (joinedStoreId === storeId) return

    joinStoreRoom(storeId)

    if (remaining <= 1) return
    joinRetryTimer = setTimeout(() => attemptJoin(remaining - 1), 400)
  }

  attemptJoin(attempts)
}

export function markStoreRoomJoined(storeId: number): void {
  joinedStoreId = storeId
  clearJoinRetryTimer()
}

export function ensureStoreRoomJoined(storeId: number): void {
  if (!socket?.connected) return
  if (joinedStoreId === storeId) return
  scheduleStoreRoomJoin(storeId)
}

export function clearJoinedStoreRoom(): void {
  joinedStoreId = null
}
