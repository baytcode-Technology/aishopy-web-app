'use client'

import {
  clearJoinedStoreRoom,
  disconnectChatSocket,
  ensureStoreRoomJoined,
  isChatSocketConnected,
  markStoreRoomJoined,
  reconnectChatSocket,
  scheduleStoreRoomJoin,
  SOCKET_EVENTS,
  type SocketConversationPayload,
  type SocketInboxAiTypingPayload,
  type SocketInstagramConversationPayload,
  type SocketInstagramMessagePayload,
  type SocketMessagePayload,
  type SocketOrderNewPayload,
  type SocketStatusPayload,
} from '@/core/lib/socket'
import {
  normalizeConversationPayload,
  normalizeInboxAiTypingPayload,
  normalizeInstagramConversationPayload,
  normalizeInstagramMessagePayload,
  normalizeMessagePayload,
  normalizeOrderPayload,
  normalizeStatusPayload,
} from '@/core/lib/socket-normalize'
import { ensureValidSession, onTokensRefreshed, SigningOutAbortError } from '@/core/lib/session-manager'
import { useStore } from '@/providers/store-provider'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'

type ChatSocketContextValue = {
  isConnected: boolean
  onMessageNew: (handler: (payload: SocketMessagePayload) => void) => () => void
  onMessageStatus: (handler: (payload: SocketStatusPayload) => void) => () => void
  onConversationUpdated: (handler: (payload: SocketConversationPayload) => void) => () => void
  onInstagramMessageNew: (handler: (payload: SocketInstagramMessagePayload) => void) => () => void
  onInstagramConversationUpdated: (
    handler: (payload: SocketInstagramConversationPayload) => void,
  ) => () => void
  onOrderNew: (handler: (payload: SocketOrderNewPayload) => void) => () => void
  onInboxAiTyping: (handler: (payload: SocketInboxAiTypingPayload) => void) => () => void
}

const ChatSocketContext = createContext<ChatSocketContextValue | null>(null)

export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { store } = useStore()
  const isConnectedRef = useRef(false)
  const storeIdRef = useRef<number | null>(null)
  const connectWithTokenRef = useRef<(token: string) => Promise<void>>(async () => {})
  const messageHandlers = useRef(new Set<(payload: SocketMessagePayload) => void>())
  const statusHandlers = useRef(new Set<(payload: SocketStatusPayload) => void>())
  const conversationHandlers = useRef(new Set<(payload: SocketConversationPayload) => void>())
  const instagramMessageHandlers = useRef(
    new Set<(payload: SocketInstagramMessagePayload) => void>(),
  )
  const instagramConversationHandlers = useRef(
    new Set<(payload: SocketInstagramConversationPayload) => void>(),
  )
  const orderHandlers = useRef(new Set<(payload: SocketOrderNewPayload) => void>())
  const inboxAiTypingHandlers = useRef(new Set<(payload: SocketInboxAiTypingPayload) => void>())

  useEffect(() => {
    let cancelled = false
    let detachSocketListeners: (() => void) | undefined

    const connectWithToken = async (token: string) => {
      if (cancelled || !store?.id) return

      detachSocketListeners?.()
      const socket = reconnectChatSocket(token)

      const handleConnect = () => {
        isConnectedRef.current = true
        scheduleStoreRoomJoin(store.id)
      }

      const handleStoreJoined = (payload: { storeId?: number | string }) => {
        const storeId =
          typeof payload?.storeId === 'number' ? payload.storeId : Number(payload?.storeId)
        if (Number.isFinite(storeId) && storeId === store.id) {
          markStoreRoomJoined(storeId)
        }
      }

      const handleDisconnect = () => {
        isConnectedRef.current = false
        clearJoinedStoreRoom()
      }

      const retryStoreJoin = () => {
        if (!store?.id || !isChatSocketConnected()) return
        ensureStoreRoomJoined(store.id)
      }

      const handleSocketError = () => {
        void ensureValidSession()
          .then((freshToken) => {
            if (cancelled || !store?.id) return
            if (isChatSocketConnected()) {
              retryStoreJoin()
              return
            }
            return connectWithToken(freshToken)
          })
          .catch((err) => {
            if (err instanceof SigningOutAbortError) return
          })
      }

      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.on('error', handleSocketError)
      socket.on(SOCKET_EVENTS.STORE_JOINED, handleStoreJoined)
      socket.on(SOCKET_EVENTS.MESSAGE_NEW, (payload: SocketMessagePayload) => {
        const normalized = normalizeMessagePayload(payload)
        if (!normalized) return
        messageHandlers.current.forEach((handler) => handler(normalized))
      })
      socket.on(SOCKET_EVENTS.MESSAGE_STATUS, (payload: SocketStatusPayload) => {
        const normalized = normalizeStatusPayload(payload)
        if (!normalized) return
        statusHandlers.current.forEach((handler) => handler(normalized))
      })
      socket.on(SOCKET_EVENTS.CONVERSATION_UPDATED, (payload: SocketConversationPayload) => {
        const normalized = normalizeConversationPayload(payload)
        if (!normalized) return
        conversationHandlers.current.forEach((handler) => handler(normalized))
      })
      socket.on(SOCKET_EVENTS.INSTAGRAM_MESSAGE_NEW, (payload: SocketInstagramMessagePayload) => {
        const normalized = normalizeInstagramMessagePayload(payload)
        if (!normalized) return
        instagramMessageHandlers.current.forEach((handler) => handler(normalized))
      })
      socket.on(
        SOCKET_EVENTS.INSTAGRAM_CONVERSATION_UPDATED,
        (payload: SocketInstagramConversationPayload) => {
          const normalized = normalizeInstagramConversationPayload(payload)
          if (!normalized) return
          instagramConversationHandlers.current.forEach((handler) => handler(normalized))
        },
      )
      socket.on(SOCKET_EVENTS.ORDER_NEW, (payload: SocketOrderNewPayload) => {
        const normalized = normalizeOrderPayload(payload)
        if (!normalized) return
        orderHandlers.current.forEach((handler) => handler(normalized))
      })
      socket.on(SOCKET_EVENTS.INBOX_AI_TYPING, (payload: SocketInboxAiTypingPayload) => {
        const normalized = normalizeInboxAiTypingPayload(payload)
        if (!normalized) return
        inboxAiTypingHandlers.current.forEach((handler) => handler(normalized))
      })

      detachSocketListeners = () => {
        socket.off('connect', handleConnect)
        socket.off('disconnect', handleDisconnect)
        socket.off('error', handleSocketError)
        socket.off(SOCKET_EVENTS.STORE_JOINED, handleStoreJoined)
        socket.off(SOCKET_EVENTS.MESSAGE_NEW)
        socket.off(SOCKET_EVENTS.MESSAGE_STATUS)
        socket.off(SOCKET_EVENTS.CONVERSATION_UPDATED)
        socket.off(SOCKET_EVENTS.INSTAGRAM_MESSAGE_NEW)
        socket.off(SOCKET_EVENTS.INSTAGRAM_CONVERSATION_UPDATED)
        socket.off(SOCKET_EVENTS.ORDER_NEW)
        socket.off(SOCKET_EVENTS.INBOX_AI_TYPING)
      }

      if (socket.connected) handleConnect()
    }

    connectWithTokenRef.current = connectWithToken
    storeIdRef.current = store?.id ?? null

    if (!store?.id) {
      disconnectChatSocket()
      isConnectedRef.current = false
      storeIdRef.current = null
      return () => {
        cancelled = true
      }
    }

    void ensureValidSession()
      .then((token) => connectWithToken(token))
      .catch((err) => {
        if (err instanceof SigningOutAbortError) return
        disconnectChatSocket()
        isConnectedRef.current = false
      })

    const unsubscribe = onTokensRefreshed((token) => {
      void connectWithToken(token)
    })

    return () => {
      cancelled = true
      unsubscribe()
      detachSocketListeners?.()
      disconnectChatSocket()
      isConnectedRef.current = false
      storeIdRef.current = null
    }
  }, [store?.id])

  useEffect(() => {
    const resume = () => {
      const storeId = storeIdRef.current
      if (!storeId) return
      if (document.visibilityState === 'hidden') return

      if (isChatSocketConnected()) {
        ensureStoreRoomJoined(storeId)
        return
      }

      void ensureValidSession()
        .then((token) => connectWithTokenRef.current(token))
        .catch((err) => {
          if (err instanceof SigningOutAbortError) return
        })
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') resume()
    }

    window.addEventListener('focus', resume)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', resume)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  const onMessageNew = useCallback((handler: (payload: SocketMessagePayload) => void) => {
    messageHandlers.current.add(handler)
    return () => {
      messageHandlers.current.delete(handler)
    }
  }, [])

  const onMessageStatus = useCallback((handler: (payload: SocketStatusPayload) => void) => {
    statusHandlers.current.add(handler)
    return () => {
      statusHandlers.current.delete(handler)
    }
  }, [])

  const onConversationUpdated = useCallback((handler: (payload: SocketConversationPayload) => void) => {
    conversationHandlers.current.add(handler)
    return () => {
      conversationHandlers.current.delete(handler)
    }
  }, [])

  const onInstagramMessageNew = useCallback(
    (handler: (payload: SocketInstagramMessagePayload) => void) => {
      instagramMessageHandlers.current.add(handler)
      return () => {
        instagramMessageHandlers.current.delete(handler)
      }
    },
    [],
  )

  const onInstagramConversationUpdated = useCallback(
    (handler: (payload: SocketInstagramConversationPayload) => void) => {
      instagramConversationHandlers.current.add(handler)
      return () => {
        instagramConversationHandlers.current.delete(handler)
      }
    },
    [],
  )

  const onOrderNew = useCallback((handler: (payload: SocketOrderNewPayload) => void) => {
    orderHandlers.current.add(handler)
    return () => {
      orderHandlers.current.delete(handler)
    }
  }, [])

  const onInboxAiTyping = useCallback((handler: (payload: SocketInboxAiTypingPayload) => void) => {
    inboxAiTypingHandlers.current.add(handler)
    return () => {
      inboxAiTypingHandlers.current.delete(handler)
    }
  }, [])

  const value = useMemo(
    () => ({
      isConnected: isConnectedRef.current,
      onMessageNew,
      onMessageStatus,
      onConversationUpdated,
      onInstagramMessageNew,
      onInstagramConversationUpdated,
      onOrderNew,
      onInboxAiTyping,
    }),
    [
      onMessageNew,
      onMessageStatus,
      onConversationUpdated,
      onInstagramMessageNew,
      onInstagramConversationUpdated,
      onOrderNew,
      onInboxAiTyping,
    ],
  )

  return <ChatSocketContext.Provider value={value}>{children}</ChatSocketContext.Provider>
}

export function useChatSocket() {
  const ctx = useContext(ChatSocketContext)
  if (!ctx) {
    throw new Error('useChatSocket must be used within ChatSocketProvider')
  }
  return ctx
}
