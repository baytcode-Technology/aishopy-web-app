'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Fab } from '@/components/catalog/Fab'
import { ConversationRow } from '@/components/chat/ConversationRow'
import { SearchBar } from '@/components/catalog/SearchBar'
import { ChatsSubscriptionGate } from '@/components/subscription/ChatsSubscriptionGate'
import { PlatformAdminSupportBanner } from '@/components/support/PlatformAdminSupportBanner'
import { EmptyState } from '@/components/ui/EmptyState'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { fetchAllChats, messagePreviewText } from '@/core/api/chats'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  mapInstagramConversation,
  mapWhatsAppConversation,
  mergeChatLists,
  sortConversations,
  upsertFromMessage,
  upsertInstagramFromConversation,
  upsertWhatsAppFromConversation,
} from '@/core/lib/chat-list'
import { isAiPaused } from '@/core/lib/inbox-ai'
import { hasPremiumAccess } from '@/core/lib/subscription'
import type { ChatListItem } from '@/core/types/chat'
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin'
import { useChatSocket } from '@/providers/chat-socket-provider'
import { useChatsUnread } from '@/providers/chats-unread-provider'
import { useStore } from '@/providers/store-provider'
import { useSupportUnread } from '@/providers/support-unread-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type LoadChatsOptions = {
  refresh?: boolean
  silent?: boolean
}

export default function InboxPage() {
  const router = useRouter()
  const { store } = useStore()
  const { supportUnreadCount } = useSupportUnread()
  const premium = hasPremiumAccess(store)
  const { isPlatformAdmin } = usePlatformAdmin()
  const { syncChatsUnread, reconcileChatsUnread, isActiveChat } = useChatsUnread()
  const {
    onConversationUpdated,
    onMessageNew,
    onInstagramConversationUpdated,
    onInstagramMessageNew,
  } = useChatSocket()
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<ChatListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const itemsLengthRef = useRef(0)
  const loadGenerationRef = useRef(0)

  const loadChats = useCallback(
    async (options?: boolean | LoadChatsOptions) => {
      if (!store?.id) return

      const opts: LoadChatsOptions =
        typeof options === 'boolean' ? { refresh: options } : (options ?? {})
      const { refresh = false, silent = false } = opts
      const generation = ++loadGenerationRef.current

      if (refresh) setIsRefreshing(true)
      else if (!silent) setIsLoading(true)

      try {
        const { whatsapp, instagram } = await fetchAllChats(store.id)
        if (generation !== loadGenerationRef.current) return

        const mergedFromApi = sortConversations([
          ...whatsapp.map(mapWhatsAppConversation),
          ...instagram.map(mapInstagramConversation),
        ])
        setItems((prev) => {
          const merged = silent ? mergeChatLists(prev, mergedFromApi) : mergedFromApi
          return reconcileChatsUnread(
            merged.map((item) =>
              isActiveChat(item.id, item.channel) ? { ...item, unread: 0 } : item,
            ),
          )
        })
        setNotice(null)
      } catch (e: unknown) {
        setNotice(getErrorMessage(e, 'Failed to load chats'))
      } finally {
        if (generation === loadGenerationRef.current) {
          setIsLoading(false)
          setIsRefreshing(false)
        }
      }
    },
    [store?.id, isActiveChat, reconcileChatsUnread],
  )

  useEffect(() => {
    itemsLengthRef.current = items.length
  }, [items.length])

  useEffect(() => {
    void loadChats({ silent: itemsLengthRef.current > 0 })
  }, [loadChats])

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void loadChats({ silent: itemsLengthRef.current > 0 })
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisibility)
    }
  }, [loadChats])

  useEffect(() => {
    syncChatsUnread(items)
  }, [items, syncChatsUnread])

  useEffect(() => {
    const unsubWaConversation = onConversationUpdated((payload) => {
      setItems((prev) => upsertWhatsAppFromConversation(prev, payload, isActiveChat))
    })

    const unsubWaMessage = onMessageNew((payload) => {
      setItems((prev) =>
        upsertFromMessage(
          prev,
          'whatsapp',
          payload,
          messagePreviewText(payload.message),
          isActiveChat,
        ),
      )
    })

    const unsubIgConversation = onInstagramConversationUpdated((payload) => {
      setItems((prev) => upsertInstagramFromConversation(prev, payload, isActiveChat))
    })

    const unsubIgMessage = onInstagramMessageNew((payload) => {
      setItems((prev) =>
        upsertFromMessage(
          prev,
          'instagram',
          payload,
          messagePreviewText(payload.message),
          isActiveChat,
        ),
      )
    })

    return () => {
      unsubWaConversation()
      unsubWaMessage()
      unsubIgConversation()
      unsubIgMessage()
    }
  }, [
    onConversationUpdated,
    onMessageNew,
    onInstagramConversationUpdated,
    onInstagramMessageNew,
    isActiveChat,
  ])

  const conversations = useMemo(() => {
    let list = items
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.subtitle.toLowerCase().includes(q),
      )
    }
    return list
  }, [items, search])

  const headerSubtitle = useMemo(() => {
    if (!store?.id) return 'Connect your store to view messages'
    if (isLoading && items.length === 0) return 'Loading conversations…'
    const n = items.length
    if (n === 0) return 'WhatsApp and Instagram conversations'
    return `${n} Conversation${n === 1 ? '' : 's'}`
  }, [store?.id, isLoading, items.length])

  const openThread = (item: ChatListItem) => {
    const params = new URLSearchParams({
      phone: item.phone,
      channel: item.channel,
      displayName: item.title,
      unread: String(item.unread),
      replyMode: item.replyMode ?? 'ai',
      aiPausedUntil: item.aiPausedUntil ?? '',
    })
    router.push(`/inbox/${item.id}?${params.toString()}`)
  }

  return (
    <div className="flex min-h-full flex-col bg-gray-100">
      <CatalogHeader
        title="Messages"
        subtitle={headerSubtitle}
        right={
          <button
            type="button"
            onClick={() => void loadChats({ refresh: true })}
            aria-label="Refresh conversations"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-surface"
          >
            <svg
              className={`h-4 w-4 text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 13.65-6.65Z" />
            </svg>
          </button>
        }
      />

      {notice ? (
        <p className="px-5 pb-2 text-sm font-semibold text-[#E11D48]">{notice}</p>
      ) : null}

      <div className="relative flex-1 pb-32">
        {isPlatformAdmin ? (
          <div className="px-4 pt-2">
            <PlatformAdminSupportBanner />
          </div>
        ) : null}

        {!premium && store?.id ? (
          <ChatsSubscriptionGate
            onViewPlans={() => router.push('/subscription')}
          />
        ) : (
          <>
            <SearchBar
              placeholder="Search conversations…"
              value={search}
              onChange={setSearch}
            />

            {conversations.length > 0 ? (
              <div className="bg-surface">
                {conversations.map((item) => (
                  <ConversationRow
                    key={`${item.channel}:${item.id}`}
                    conversation={{
                      ...item,
                      aiHandling:
                        hasPremiumAccess(store) &&
                        store?.ai_auto_reply_enabled === true &&
                        item.replyMode === 'ai' &&
                        !isAiPaused(item.aiPausedUntil),
                    }}
                    onPress={() => openThread(item)}
                  />
                ))}
              </div>
            ) : store?.id ? (
              <p className="p-10 text-center text-[14px] text-gray-500">
                {isLoading ? 'Loading conversations…' : 'No conversations found'}
              </p>
            ) : (
              <EmptyState
                icon="inbox"
                title="No store yet"
                description="Create a store to view messages."
              />
            )}
          </>
        )}

        <Fab
          label="Chat with AI"
          badgeCount={supportUnreadCount}
          onClick={() => router.push('/help-center')}
        >
          <MenuIcon name="comment-o" className="h-[22px] w-[22px] text-brand-on-primary" />
        </Fab>
      </div>
    </div>
  )
}
