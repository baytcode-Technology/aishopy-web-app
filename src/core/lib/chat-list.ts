import type { ChatChannel, ChatListItem } from '@/core/types/chat'

export function initialsFromLabel(label: string, fallback: string) {
  const cleaned = label.replace(/^@/, '').trim()
  if (!cleaned) return fallback
  const parts = cleaned.split(/\s+/)
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
  }
  return (cleaned.slice(0, 2) || fallback).toUpperCase()
}

export function formatChatTime(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatWaPhone(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return phone
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

export function mapWhatsAppConversation(c: {
  id: number
  customer_wa_number: string
  customer_name?: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count?: number
  reply_mode?: 'ai' | 'manual'
  ai_paused_until?: string | null
}): ChatListItem {
  const phone = c.customer_wa_number
  const name = c.customer_name?.trim()
  const title = name || formatWaPhone(phone)
  return {
    id: c.id,
    channel: 'whatsapp',
    title,
    subtitle: c.last_message_preview ?? '—',
    time: formatChatTime(c.last_message_at),
    sortAt: c.last_message_at,
    unread: c.unread_count ?? 0,
    online: false,
    phone,
    initials: initialsFromLabel(title, 'WA'),
    replyMode: c.reply_mode ?? 'ai',
    aiPausedUntil: c.ai_paused_until ?? null,
  }
}

export function mapInstagramConversation(c: {
  id: number
  customer_ig_id: string
  customer_ig_username: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count?: number
  reply_mode?: 'ai' | 'manual'
  ai_paused_until?: string | null
}): ChatListItem {
  const title = c.customer_ig_username ? `@${c.customer_ig_username}` : c.customer_ig_id
  return {
    id: c.id,
    channel: 'instagram',
    title,
    subtitle: c.last_message_preview ?? '—',
    time: formatChatTime(c.last_message_at),
    sortAt: c.last_message_at,
    unread: c.unread_count ?? 0,
    online: false,
    phone: c.customer_ig_id,
    initials: initialsFromLabel(title, 'IG'),
    replyMode: c.reply_mode ?? 'ai',
    aiPausedUntil: c.ai_paused_until ?? null,
  }
}

export function sortConversations(items: ChatListItem[]): ChatListItem[] {
  return [...items].sort((a, b) => {
    const ta = a.sortAt ? Date.parse(a.sortAt) : 0
    const tb = b.sortAt ? Date.parse(b.sortAt) : 0
    return tb - ta
  })
}

export function findConversation(
  items: ChatListItem[],
  channel: ChatChannel,
  id: number,
): ChatListItem | undefined {
  return items.find((item) => item.channel === channel && item.id === id)
}

export function withoutConversation(
  items: ChatListItem[],
  channel: ChatChannel,
  id: number,
): ChatListItem[] {
  return items.filter((item) => !(item.channel === channel && item.id === id))
}

export function mergeChatLists(current: ChatListItem[], fetched: ChatListItem[]): ChatListItem[] {
  const map = new Map<string, ChatListItem>()
  for (const item of current) {
    map.set(`${item.channel}:${item.id}`, item)
  }
  for (const item of fetched) {
    const key = `${item.channel}:${item.id}`
    const prev = map.get(key)
    if (!prev) {
      map.set(key, item)
      continue
    }
    const prevTs = prev.sortAt ? Date.parse(prev.sortAt) : 0
    const nextTs = item.sortAt ? Date.parse(item.sortAt) : 0
    map.set(key, {
      ...prev,
      ...item,
      title: item.title || prev.title,
      replyMode: item.replyMode ?? prev.replyMode,
      aiPausedUntil: item.aiPausedUntil ?? prev.aiPausedUntil,
      unread: resolveListUnread({
        isActive: false,
        payloadUnread: item.unread,
        existingUnread: prev.unread,
      }),
      ...(prevTs > nextTs
        ? { subtitle: prev.subtitle, time: prev.time, sortAt: prev.sortAt }
        : {}),
    })
  }
  return sortConversations(Array.from(map.values()))
}

function resolveListUnread(input: {
  isActive: boolean
  payloadUnread: number | undefined
  existingUnread: number | undefined
}): number {
  if (input.isActive) return 0
  const payload = input.payloadUnread
  const existing = input.existingUnread ?? 0
  if (payload === 0 && existing > 0) return existing
  return payload ?? existing
}

export function upsertWhatsAppFromConversation(
  prev: ChatListItem[],
  payload: {
    conversation: {
      id: number
      customer_wa_number: string
      last_message_at: string | null
      last_message_preview: string | null
      unread_count: number
      reply_mode?: 'ai' | 'manual'
      ai_paused_until?: string | null
    }
  },
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean,
): ChatListItem[] {
  const existing = findConversation(prev, 'whatsapp', payload.conversation.id)
  const title = existing?.title ?? formatWaPhone(payload.conversation.customer_wa_number)
  const updated: ChatListItem = {
    id: payload.conversation.id,
    channel: 'whatsapp',
    title,
    subtitle: payload.conversation.last_message_preview ?? existing?.subtitle ?? '—',
    time: formatChatTime(payload.conversation.last_message_at),
    sortAt: payload.conversation.last_message_at,
    unread: resolveListUnread({
      isActive: isActiveChat(payload.conversation.id, 'whatsapp'),
      payloadUnread: payload.conversation.unread_count,
      existingUnread: existing?.unread,
    }),
    online: existing?.online ?? false,
    phone: payload.conversation.customer_wa_number,
    initials: existing?.initials ?? initialsFromLabel(title, 'WA'),
    replyMode: payload.conversation.reply_mode ?? existing?.replyMode ?? 'ai',
    aiPausedUntil:
      payload.conversation.ai_paused_until !== undefined
        ? payload.conversation.ai_paused_until
        : (existing?.aiPausedUntil ?? null),
  }
  return sortConversations([updated, ...withoutConversation(prev, 'whatsapp', updated.id)])
}

export function upsertInstagramFromConversation(
  prev: ChatListItem[],
  payload: {
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
  },
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean,
): ChatListItem[] {
  const existing = findConversation(prev, 'instagram', payload.conversation.id)
  const title = payload.conversation.customer_ig_username
    ? `@${payload.conversation.customer_ig_username}`
    : (existing?.title ?? payload.conversation.customer_ig_id)
  const updated: ChatListItem = {
    id: payload.conversation.id,
    channel: 'instagram',
    title,
    subtitle: payload.conversation.last_message_preview ?? existing?.subtitle ?? '—',
    time: formatChatTime(payload.conversation.last_message_at),
    sortAt: payload.conversation.last_message_at,
    unread: resolveListUnread({
      isActive: isActiveChat(payload.conversation.id, 'instagram'),
      payloadUnread: payload.conversation.unread_count,
      existingUnread: existing?.unread,
    }),
    online: existing?.online ?? false,
    phone: payload.conversation.customer_ig_id,
    initials: existing?.initials ?? initialsFromLabel(title, 'IG'),
    replyMode: payload.conversation.reply_mode ?? existing?.replyMode ?? 'ai',
    aiPausedUntil:
      payload.conversation.ai_paused_until !== undefined
        ? payload.conversation.ai_paused_until
        : (existing?.aiPausedUntil ?? null),
  }
  return sortConversations([updated, ...withoutConversation(prev, 'instagram', updated.id)])
}

export function upsertFromMessage(
  prev: ChatListItem[],
  channel: ChatChannel,
  payload: {
    conversationId: number
    message: {
      direction: string
      timestamp: string | null
      type: string
      text_body: string | null
    }
  },
  preview: string,
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean,
): ChatListItem[] {
  const existing = findConversation(prev, channel, payload.conversationId)
  const sortAt = payload.message.timestamp
  const isInbound = payload.message.direction === 'inbound'
  const fallbackTitle = channel === 'instagram' ? 'Instagram' : 'WhatsApp'
  const fallbackInitials = channel === 'instagram' ? 'IG' : 'WA'
  const updated: ChatListItem = existing
    ? {
        ...existing,
        subtitle: preview,
        time: formatChatTime(sortAt),
        sortAt,
        unread: isInbound
          ? isActiveChat(payload.conversationId, channel)
            ? 0
            : existing.unread + 1
          : existing.unread,
      }
    : {
        id: payload.conversationId,
        channel,
        title: fallbackTitle,
        subtitle: preview,
        time: formatChatTime(sortAt),
        sortAt,
        unread: isInbound && !isActiveChat(payload.conversationId, channel) ? 1 : 0,
        online: false,
        phone: '',
        initials: fallbackInitials,
        replyMode: 'ai',
      }
  return sortConversations([updated, ...withoutConversation(prev, channel, updated.id)])
}
