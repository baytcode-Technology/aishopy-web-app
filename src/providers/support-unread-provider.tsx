'use client'

import { fetchSupportUnread, markSupportRead as markSupportReadApi } from '@/core/api/support'
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

const SUPPORT_UNREAD_POLL_MS = 4000

type SupportUnreadContextValue = {
  supportUnreadCount: number
  supportUnreadPreview: string | null
  refreshSupportUnread: () => Promise<void>
  setActiveSupportChat: (conversationId: number | null) => void
  markSupportRead: (conversationId: number) => Promise<void>
}

const SupportUnreadContext = createContext<SupportUnreadContextValue | null>(null)

export function SupportUnreadProvider({ children }: { children: ReactNode }) {
  const { store } = useStore()
  const [supportUnreadCount, setSupportUnreadCount] = useState(0)
  const [supportUnreadPreview, setSupportUnreadPreview] = useState<string | null>(null)
  const activeSupportChatRef = useRef<number | null>(null)

  const applySupportUnread = useCallback((count: number, preview: string | null) => {
    const activeId = activeSupportChatRef.current
    const effectiveCount = activeId != null ? 0 : count
    setSupportUnreadCount(effectiveCount)
    setSupportUnreadPreview(preview)
  }, [])

  const refreshSupportUnread = useCallback(async () => {
    if (!store?.id) return
    try {
      const res = await fetchSupportUnread(store.id)
      applySupportUnread(res.data.unread_count, res.data.last_preview)
    } catch {
      // Keep last known count.
    }
  }, [store?.id, applySupportUnread])

  const setActiveSupportChat = useCallback(
    (conversationId: number | null) => {
      activeSupportChatRef.current = conversationId
      if (conversationId != null) {
        applySupportUnread(0, null)
      } else {
        void refreshSupportUnread()
      }
    },
    [applySupportUnread, refreshSupportUnread],
  )

  const markSupportRead = useCallback(
    async (conversationId: number) => {
      if (!store?.id) return
      try {
        const res = await markSupportReadApi(store.id, conversationId)
        applySupportUnread(res.data.summary.unread_count, res.data.summary.last_preview)
      } catch {
        // Keep last known count.
      }
    },
    [store?.id, applySupportUnread],
  )

  useEffect(() => {
    if (!store?.id) {
      setSupportUnreadCount(0)
      setSupportUnreadPreview(null)
      activeSupportChatRef.current = null
      return
    }
    void refreshSupportUnread()
  }, [store?.id, refreshSupportUnread])

  useEffect(() => {
    if (!store?.id) return
    const interval = window.setInterval(() => {
      void refreshSupportUnread()
    }, SUPPORT_UNREAD_POLL_MS)
    return () => window.clearInterval(interval)
  }, [store?.id, refreshSupportUnread])

  useEffect(() => {
    if (!store?.id) return

    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void refreshSupportUnread()
      }
    }

    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)
    return () => {
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [store?.id, refreshSupportUnread])

  const value = useMemo(
    () => ({
      supportUnreadCount,
      supportUnreadPreview,
      refreshSupportUnread,
      setActiveSupportChat,
      markSupportRead,
    }),
    [supportUnreadCount, supportUnreadPreview, refreshSupportUnread, setActiveSupportChat, markSupportRead],
  )

  return <SupportUnreadContext.Provider value={value}>{children}</SupportUnreadContext.Provider>
}

export function useSupportUnread(): SupportUnreadContextValue {
  const ctx = useContext(SupportUnreadContext)
  if (!ctx) {
    throw new Error('useSupportUnread must be used within SupportUnreadProvider')
  }
  return ctx
}
