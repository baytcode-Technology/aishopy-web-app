'use client'

import { ConversationRow } from '@/components/chat/ConversationRow'
import { SearchBar } from '@/components/catalog/SearchBar'
import { fetchChats, fetchInstagramChats } from '@/core/api/chats'
import { getErrorMessage } from '@/core/lib/api-error'
import { mapInstagramConversation, mapWhatsAppConversation } from '@/core/lib/chat-list'
import type { ChatChannel, ChatListItem, ChatMessage } from '@/core/types/chat'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Props = {
  visible: boolean
  storeId: number
  sourceConversationId: number
  channel: ChatChannel
  message: ChatMessage | null
  onClose: () => void
  onForward: (input: { targetConversationId: number; targetPhone: string }) => Promise<void>
}

export function ForwardMessageModal({
  visible,
  storeId,
  sourceConversationId,
  channel,
  message,
  onClose,
  onForward,
}: Props) {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ChatListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!storeId) return
    setLoading(true)
    try {
      if (channel === 'instagram') {
        const res = await fetchInstagramChats(storeId)
        setItems(
          res.data.chats
            .filter((c) => c.id !== sourceConversationId)
            .map(mapInstagramConversation),
        )
      } else {
        const res = await fetchChats(storeId)
        setItems(
          res.data.chats
            .filter((c) => c.id !== sourceConversationId)
            .map(mapWhatsAppConversation),
        )
      }
      setNotice(null)
    } catch (e: unknown) {
      setNotice(getErrorMessage(e, 'Failed to load chats'))
    } finally {
      setLoading(false)
    }
  }, [storeId, sourceConversationId, channel])

  useEffect(() => {
    if (visible) void load()
  }, [visible, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    )
  }, [items, search])

  const handleSelect = async (item: ChatListItem) => {
    if (!message || sending) return
    setSending(true)
    try {
      await onForward({ targetConversationId: item.id, targetPhone: item.phone })
      setNotice('Message forwarded')
      onClose()
    } catch (e: unknown) {
      setNotice(getErrorMessage(e, 'Forward failed'))
    } finally {
      setSending(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
      <div className="flex items-center justify-between px-4 pb-3 pt-4">
        <p className="text-lg font-bold text-ink">Forward to</p>
        <button type="button" className="font-semibold text-brand-primary" onClick={onClose}>
          Cancel
        </button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search chats" />
      {notice ? <p className="px-5 pb-2 text-sm font-semibold text-[#E11D48]">{notice}</p> : null}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-gray-500">No conversations found</p>
      ) : (
        <div className="flex-1 overflow-y-auto bg-surface pb-6">
          {filtered.map((item) => (
            <ConversationRow
              key={`${item.channel}-${item.id}`}
              conversation={item}
              onPress={() => void handleSelect(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
