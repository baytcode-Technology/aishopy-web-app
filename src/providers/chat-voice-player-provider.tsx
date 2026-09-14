'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
} from 'react'

type ChatVoicePlayerContextValue = {
  requestPlay: (messageId: string, pauseSelf: () => void) => Promise<void>
  release: (messageId: string) => void
}

const ChatVoicePlayerContext = createContext<ChatVoicePlayerContextValue | null>(null)

export function ChatVoicePlayerProvider({ children }: { children: ReactNode }) {
  const activeIdRef = useRef<string | null>(null)
  const pauseRef = useRef<(() => void) | null>(null)

  const requestPlay = useCallback(async (messageId: string, pauseSelf: () => void) => {
    if (activeIdRef.current && activeIdRef.current !== messageId) {
      pauseRef.current?.()
    }
    activeIdRef.current = messageId
    pauseRef.current = pauseSelf
  }, [])

  const release = useCallback((messageId: string) => {
    if (activeIdRef.current === messageId) {
      activeIdRef.current = null
      pauseRef.current = null
    }
  }, [])

  return (
    <ChatVoicePlayerContext.Provider value={{ requestPlay, release }}>
      {children}
    </ChatVoicePlayerContext.Provider>
  )
}

export function useChatVoicePlayer() {
  const ctx = useContext(ChatVoicePlayerContext)
  if (!ctx) {
    throw new Error('useChatVoicePlayer must be used within ChatVoicePlayerProvider')
  }
  return ctx
}
