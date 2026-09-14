import type {
  SocketConversationPayload,
  SocketInboxAiTypingPayload,
  SocketInstagramConversationPayload,
  SocketInstagramMessagePayload,
  SocketMessagePayload,
  SocketOrderNewPayload,
  SocketStatusPayload,
} from '@/core/lib/socket'

export function toSocketId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeMessagePayload(payload: SocketMessagePayload): SocketMessagePayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversationId)
  const messageId = toSocketId(payload.message?.id)
  if (storeId == null || conversationId == null || messageId == null || !payload.message) {
    return null
  }
  return {
    ...payload,
    storeId,
    conversationId,
    message: {
      ...payload.message,
      id: messageId,
    },
  }
}

export function normalizeStatusPayload(payload: SocketStatusPayload): SocketStatusPayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversationId)
  if (storeId == null || conversationId == null) return null
  return { ...payload, storeId, conversationId }
}

export function normalizeConversationPayload(
  payload: SocketConversationPayload,
): SocketConversationPayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversation?.id)
  if (storeId == null || conversationId == null || !payload.conversation) return null
  return {
    ...payload,
    storeId,
    conversation: {
      ...payload.conversation,
      id: conversationId,
      unread_count: Number(payload.conversation.unread_count ?? 0),
    },
  }
}

export function normalizeInstagramMessagePayload(
  payload: SocketInstagramMessagePayload,
): SocketInstagramMessagePayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversationId)
  const messageId = toSocketId(payload.message?.id)
  if (storeId == null || conversationId == null || messageId == null || !payload.message) {
    return null
  }
  return {
    ...payload,
    storeId,
    conversationId,
    message: {
      ...payload.message,
      id: messageId,
    },
  }
}

export function normalizeInstagramConversationPayload(
  payload: SocketInstagramConversationPayload,
): SocketInstagramConversationPayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversation?.id)
  if (storeId == null || conversationId == null || !payload.conversation) return null
  return {
    ...payload,
    storeId,
    conversation: {
      ...payload.conversation,
      id: conversationId,
      unread_count: Number(payload.conversation.unread_count ?? 0),
    },
  }
}

export function normalizeOrderPayload(payload: SocketOrderNewPayload): SocketOrderNewPayload | null {
  const storeId = toSocketId(payload.storeId)
  const orderId = toSocketId(payload.order?.id)
  if (storeId == null || orderId == null || !payload.order) return null
  return {
    ...payload,
    storeId,
    order: {
      ...payload.order,
      id: orderId,
    },
  }
}

export function normalizeInboxAiTypingPayload(
  payload: SocketInboxAiTypingPayload,
): SocketInboxAiTypingPayload | null {
  const storeId = toSocketId(payload.storeId)
  const conversationId = toSocketId(payload.conversationId)
  if (storeId == null || conversationId == null) return null
  return { ...payload, storeId, conversationId }
}
