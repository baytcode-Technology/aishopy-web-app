import type { ChatChannel, ChatListItem } from '@/core/types/chat'

export function inboxUnreadStorageKey(storeId: number): string {
  return `aishopy.inboxUnread.v1.${storeId}`
}

export function chatUnreadKey(channel: ChatChannel, conversationId: number): string {
  return `${channel}:${conversationId}`
}

export function readInboxUnreadMap(storeId: number): Map<string, number> {
  try {
    const raw = sessionStorage.getItem(inboxUnreadStorageKey(storeId))
    if (!raw) return new Map()
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const map = new Map<string, number>()
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        map.set(key, value)
      }
    }
    return map
  } catch {
    return new Map()
  }
}

export function writeInboxUnreadMap(storeId: number, map: Map<string, number>): void {
  try {
    const obj: Record<string, number> = {}
    for (const [key, value] of map) {
      if (value > 0) obj[key] = value
    }
    sessionStorage.setItem(inboxUnreadStorageKey(storeId), JSON.stringify(obj))
  } catch {
    // Private mode / quota — in-memory map still works for this session.
  }
}

export function countUnreadKeys(
  map: Map<string, number>,
  active: { conversationId: number; channel: ChatChannel } | null,
): number {
  let count = 0
  for (const [key, unread] of map) {
    if (unread <= 0) continue
    if (active && key === chatUnreadKey(active.channel, active.conversationId)) continue
    count += 1
  }
  return count
}

export function applyPreservedUnread(
  items: ChatListItem[],
  preserved: Map<string, number>,
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean,
): ChatListItem[] {
  return items.map((item) => {
    if (isActiveChat(item.id, item.channel)) return { ...item, unread: 0 }
    const existing = preserved.get(chatUnreadKey(item.channel, item.id)) ?? 0
    if (item.unread === 0 && existing > 0) return { ...item, unread: existing }
    return item
  })
}
