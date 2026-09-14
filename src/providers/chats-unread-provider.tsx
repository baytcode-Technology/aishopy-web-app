'use client'

import { fetchAllChats, markChatRead as markChatReadApi } from '@/core/api/chats'
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
  refreshChatsUnread: () => Promise<void>
  onChatsInvalidate: (handler: () => void) => () => void
  onActiveChatMessage: (handler: (conversationId: number) => void) => () => void
  setActiveChat: (chat: ActiveChat | null) => void
  isActiveChat: (conversationId: number, channel: ChatChannel) => boolean
  markChatRead: (conversationId: number, channel: ChatChannel) => Promise<void>
}

const ChatsUnreadContext = createContext<ChatsUnreadContextValue | null>(null)

function countChatsUnread(items: ChatListItem[]): number {
  return items.reduce((sum, item) => sum + (item.unread > 0 ? item.unread : 0), 0)
}

export function ChatsUnreadProvider({ children }: { children: ReactNode }) {
  const { store } = useStore()
  const { onMessageNew, onInstagramMessageNew } = useChatSocket()
  const [chatsUnreadCount, setChatsUnreadCount] = useState(0)
  const activeChatRef = useRef<ActiveChat | null>(null)
  const [activeChat, setActiveChatState] = useState<ActiveChat | null>(null)
  const chatsInvalidateListeners = useRef(new Set<() => void>())
  const activeChatMessageListeners = useRef(new Set<(conversationId: number) => void>())
  const chatRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markChatReadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncChatsUnread = useCallback((items: ChatListItem[]) => {
    setChatsUnreadCount(countChatsUnread(items))
  }, [])

  const refreshChatsUnread = useCallback(async () => {
    if (!store?.id) return
    try {
      const { whatsapp, instagram } = await fetchAllChats(store.id)
      const total =
        whatsapp.reduce((sum, chat) => sum + (chat.unread_count ?? 0), 0) +
        instagram.reduce((sum, chat) => sum + (chat.unread_count ?? 0), 0)
      setChatsUnreadCount(total)
      chatsInvalidateListeners.current.forEach((handler) => handler())
    } catch {
      // List screens surface fetch errors; keep last known count here.
    }
  }, [store?.id])

  const setActiveChat = useCallback((chat: ActiveChat | null) => {
    activeChatRef.current = chat
    setActiveChatState(chat)
  }, [])

  const isActiveChat = useCallback(
    (conversationId: number, channel: ChatChannel) =>
      activeChat?.conversationId === conversationId && activeChat.channel === channel,
    [activeChat],
  )

  const markChatRead = useCallback(
    async (conversationId: number, channel: ChatChannel) => {
      if (!store?.id) return
      try {
        await markChatReadApi({ storeId: store.id, conversationId, channel })
      } catch {
        // Socket update may still clear row unread.
      }
    },
    [store?.id],
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

      if (chatRefreshTimer.current) {
        clearTimeout(chatRefreshTimer.current)
      }
      chatRefreshTimer.current = setTimeout(() => {
        chatRefreshTimer.current = null
        void refreshChatsUnread()
      }, CHAT_REFRESH_DEBOUNCE_MS)
    },
    [refreshChatsUnread, scheduleMarkChatRead],
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
      setActiveChatState(null)
      return
    }
    void refreshChatsUnread()
  }, [store?.id, refreshChatsUnread])

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
    return () => {
      if (chatRefreshTimer.current) clearTimeout(chatRefreshTimer.current)
      if (markChatReadTimer.current) clearTimeout(markChatReadTimer.current)
    }
  }, [])

  const value = useMemo(
    () => ({
      chatsUnreadCount,
      syncChatsUnread,
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
