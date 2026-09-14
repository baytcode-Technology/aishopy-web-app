'use client'

import { fetchAllChats, markChatRead as markChatReadApi } from '@/core/api/chats'
import {
  applyPreservedUnread,
  chatUnreadKey,
  countUnreadKeys,
  readInboxUnreadMap,
  writeInboxUnreadMap,
} from '@/core/lib/inbox-unread-memory'
import type { ChatChannel, ChatListItem } from '@/core/types/chat'
import { useChatSocket } from '@/providers/chat-socket-provider'
import { useStore } from '@/providers/store-provider'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

const CHAT_REFRESH_DEBOUNCE_MS = 400
const MARK_CHAT_READ_DEBOUNCE_MS = 500

type ActiveChat = { conversationId: number; channel: ChatChannel }

type ChatsUnreadContextValue = {
  chatsUnreadCount: number
  syncChatsUnread: (items: ChatListItem[]) => void
  reconcileChatsUnread: (items: ChatListItem[]) => ChatListItem[]
  refreshChatsUnread: () => Promise<void>
  onChatsInvalidate: (handler: () => void) => () => void
  onActiveChatMessage: (handler: (conversationId: number) => void) => () => void
  setActiveChat: (chat: ActiveChat | null) => void
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean
  markChatRead: (conversationId: number, channel: ChatChannel) => Promise<void>
}

const ChatsUnreadContext = createContext<ChatsUnreadContextValue | null>(null)

export function ChatsUnreadProvider({ children }: { children: ReactNode }) {
  const { store } = useStore()
  const { onMessageNew, onInstagramMessageNew } = useChatSocket()
  const [chatsUnreadCount, setChatsUnreadCount] = useState(0)
  const activeChatRef = useRef<ActiveChat | null>(null)
  const lastItemsRef = useRef<ChatListItem[]>([])
  const unreadMapRef = useRef<Map<string, number>>(new Map())
  const chatsInvalidateListeners = useRef(new Set<() => void>())
  const activeChatMessageListeners = useRef(new Set<(conversationId: number) => void>())
  const chatRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markChatReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persistAndCount = useCallback(() => {
    if (store?.id) writeInboxUnreadMap(store.id, unreadMapRef.current)
    setChatsUnreadCount(countUnreadKeys(unreadMapRef.current, activeChatRef.current))
  }, [store?.id])

  const reconcileChatsUnread = useCallback((items: ChatListItem[]) => {
    return applyPreservedUnread(items, unreadMapRef.current, (conversationId, channel) => {
      const active = activeChatRef.current
      return active?.conversationId === conversationId && active.channel === channel
    })
  }, [])

  const syncChatsUnread = useCallback(
    (items: ChatListItem[]) => {
      if (items.length === 0) return
      lastItemsRef.current = items
      for (const item of items) {
        const key = chatUnreadKey(item.channel, item.id)
        const active = activeChatRef.current
        const isActive = active?.conversationId === item.id && active.channel === item.channel
        if (isActive || item.unread === 0) {
          if (isActive) unreadMapRef.current.set(key, 0)
          continue
        }
        unreadMapRef.current.set(key, Math.max(unreadMapRef.current.get(key) ?? 0, item.unread))
      }
      persistAndCount()
    },
    [persistAndCount],
  )

  const refreshChatsUnread = useCallback(async () => {
    if (!store?.id) return
    try {
      const { whatsapp, instagram } = await fetchAllChats(store.id)
      const active = activeChatRef.current
      const apiChats = [
        ...whatsapp.map((chat) => ({
          id: chat.id,
          channel: 'whatsapp' as const,
          unread: chat.unread_count ?? 0,
        })),
        ...instagram.map((chat) => ({
          id: chat.id,
          channel: 'instagram' as const,
          unread: chat.unread_count ?? 0,
        })),
      ]

      for (const chat of apiChats) {
        const key = chatUnreadKey(chat.channel, chat.id)
        const isActive = active?.conversationId === chat.id && active.channel === chat.channel
        if (isActive) {
          unreadMapRef.current.set(key, 0)
          continue
        }
        const existing = unreadMapRef.current.get(key) ?? 0
        unreadMapRef.current.set(key, chat.unread === 0 && existing > 0 ? existing : chat.unread)
      }

      persistAndCount()
    } catch {
      // List screens surface fetch errors; keep last known count here.
    }
  }, [persistAndCount, store?.id])

  const setActiveChat = useCallback(
    (chat: ActiveChat | null) => {
      activeChatRef.current = chat
      if (chat == null && markChatReadTimer.current) {
        clearTimeout(markChatReadTimer.current)
        markChatReadTimer.current = null
      }
      if (chat) unreadMapRef.current.set(chatUnreadKey(chat.channel, chat.conversationId), 0)
      persistAndCount()
    },
    [persistAndCount],
  )

  const isActiveChat = useCallback((conversationId: number, channel: ChatChannel) => {
    const active = activeChatRef.current
    return active?.conversationId === conversationId && active.channel === channel
  }, [])

  const markChatRead = useCallback(
    async (conversationId: number, channel: ChatChannel) => {
      if (!store?.id) return
      unreadMapRef.current.set(chatUnreadKey(channel, conversationId), 0)
      lastItemsRef.current = lastItemsRef.current.map((item) =>
        item.id === conversationId && item.channel === channel ? { ...item, unread: 0 } : item,
      )
      persistAndCount()
      try {
        await markChatReadApi({ storeId: store.id, conversationId, channel })
      } catch {
        // Socket update may still clear row unread.
      }
    },
    [persistAndCount, store?.id],
  )

  const scheduleMarkChatRead = useCallback(
    (conversationId: number, channel: ChatChannel) => {
      if (markChatReadTimer.current) {
        clearTimeout(markChatReadTimer.current)
      }
      markChatReadTimer.current = setTimeout(() => {
        markChatReadTimer.current = null
        const active = activeChatRef.current
        if (
          !active ||
          active.conversationId !== conversationId ||
          active.channel !== channel
        ) {
          return
        }
        void markChatRead(conversationId, channel)
      }, MARK_CHAT_READ_DEBOUNCE_MS)
    },
    [markChatRead],
  )

  const bumpUnread = useCallback(
    (conversationId: number, channel: ChatChannel) => {
      const active = activeChatRef.current
      if (active?.conversationId === conversationId && active.channel === channel) return
      const key = chatUnreadKey(channel, conversationId)
      unreadMapRef.current.set(key, (unreadMapRef.current.get(key) ?? 0) + 1)
      lastItemsRef.current = lastItemsRef.current.map((item) =>
        item.id === conversationId && item.channel === channel
          ? { ...item, unread: item.unread + 1 }
          : item,
      )
      persistAndCount()
    },
    [persistAndCount],
  )

  const scheduleChatsRefresh = useCallback(
    (conversationId?: number, channel?: ChatChannel, markRead = false) => {
      const active = activeChatRef.current
      if (
        markRead &&
        conversationId &&
        active?.conversationId === conversationId &&
        (!channel || active.channel === channel)
      ) {
        scheduleMarkChatRead(conversationId, active.channel)
        activeChatMessageListeners.current.forEach((handler) => handler(conversationId))
        return
      }

      if (conversationId && channel) bumpUnread(conversationId, channel)

      if (chatRefreshTimer.current) {
        clearTimeout(chatRefreshTimer.current)
      }
      chatRefreshTimer.current = setTimeout(() => {
        chatRefreshTimer.current = null
        void refreshChatsUnread()
      }, CHAT_REFRESH_DEBOUNCE_MS)
    },
    [bumpUnread, refreshChatsUnread, scheduleMarkChatRead],
  )

  const onChatsInvalidate = useCallback((handler: () => void) => {
    chatsInvalidateListeners.current.add(handler)
    return () => {
      chatsInvalidateListeners.current.delete(handler)
    }
  }, [])

  const onActiveChatMessage = useCallback((handler: (conversationId: number) => void) => {
    activeChatMessageListeners.current.add(handler)
    return () => {
      activeChatMessageListeners.current.delete(handler)
    }
  }, [])

  useEffect(() => {
    if (!store?.id) {
      setChatsUnreadCount(0)
      activeChatRef.current = null
      lastItemsRef.current = []
      unreadMapRef.current = new Map()
      return
    }
    unreadMapRef.current = readInboxUnreadMap(store.id)
    persistAndCount()
    void refreshChatsUnread()
  }, [store?.id, persistAndCount, refreshChatsUnread])

  useEffect(() => {
    const unsubWaMessage = onMessageNew((payload) => {
      if (payload.message.direction !== 'inbound') return
      scheduleChatsRefresh(payload.conversationId, 'whatsapp', true)
    })
    const unsubIgMessage = onInstagramMessageNew((payload) => {
      if (payload.message.direction !== 'inbound') return
      scheduleChatsRefresh(payload.conversationId, 'instagram', true)
    })

    return () => {
      unsubWaMessage()
      unsubIgMessage()
    }
  }, [onMessageNew, onInstagramMessageNew, scheduleChatsRefresh])

  useEffect(() => {
    if (!store?.id) return

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshChatsUnread()
      }
    }

    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [store?.id, refreshChatsUnread])

  useEffect(() => {
    return () => {
      if (chatRefreshTimer.current) clearTimeout(chatRefreshTimer.current)
      if (markChatReadTimer.current) clearTimeout(markChatReadTimer.current)
    }
  }, [])

  const value = useMemo(
    () => ({
      chatsUnreadCount,
      syncChatsUnread,
      reconcileChatsUnread,
      refreshChatsUnread,
      onChatsInvalidate,
      onActiveChatMessage,
      setActiveChat,
      isActiveChat,
      markChatRead,
    }),
    [
      chatsUnreadCount,
      syncChatsUnread,
      reconcileChatsUnread,
      refreshChatsUnread,
      onChatsInvalidate,
      onActiveChatMessage,
      setActiveChat,
      isActiveChat,
      markChatRead,
    ],
  )

  return <ChatsUnreadContext.Provider value={value}>{children}</ChatsUnreadContext.Provider>
}

export function useChatsUnread(): ChatsUnreadContextValue {
  const ctx = useContext(ChatsUnreadContext)
  if (!ctx) {
    throw new Error('useChatsUnread must be used within ChatsUnreadProvider')
  }
  return ctx
}
