'use client'

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

export type VoiceRecordingStatus = 'recording' | 'paused'

export type VoiceRecordingSessionView = {
  conversationId: number
  status: VoiceRecordingStatus
  seconds: number
}

type VoiceRecordingSession = VoiceRecordingSessionView & {
  recorder: MediaRecorder
  stream: MediaStream
  chunks: Blob[]
}

type ChatVoiceRecordingContextValue = {
  session: VoiceRecordingSessionView | null
  getSession: (conversationId: number) => VoiceRecordingSessionView | null
  startRecording: (conversationId: number) => Promise<void>
  pauseRecording: (conversationId: number) => Promise<void>
  resumeRecording: (conversationId: number) => Promise<void>
  cancelRecording: (conversationId: number) => Promise<void>
  finishRecording: (conversationId: number) => Promise<File | null>
}

const ChatVoiceRecordingContext = createContext<ChatVoiceRecordingContextValue | null>(null)

function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop())
}

export function ChatVoiceRecordingProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<VoiceRecordingSession | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [session, setSession] = useState<VoiceRecordingSessionView | null>(null)

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startTimer = useCallback(() => {
    stopTimer()
    timerRef.current = setInterval(() => {
      const current = sessionRef.current
      if (!current || current.status !== 'recording') return
      const nextSeconds = current.seconds + 1
      sessionRef.current = { ...current, seconds: nextSeconds }
      setSession({
        conversationId: current.conversationId,
        status: current.status,
        seconds: nextSeconds,
      })
    }, 1000)
  }, [stopTimer])

  const syncSessionState = useCallback((next: VoiceRecordingSession | null) => {
    sessionRef.current = next
    setSession(
      next
        ? {
            conversationId: next.conversationId,
            status: next.status,
            seconds: next.seconds,
          }
        : null,
    )
  }, [])

  const clearSession = useCallback(async () => {
    stopTimer()
    const current = sessionRef.current
    sessionRef.current = null
    setSession(null)
    if (!current) return
    try {
      if (current.recorder.state !== 'inactive') current.recorder.stop()
    } catch {
      // ignore
    }
    stopStream(current.stream)
  }, [stopTimer])

  const cancelRecording = useCallback(
    async (conversationId: number) => {
      const current = sessionRef.current
      if (!current || current.conversationId !== conversationId) return
      await clearSession()
    },
    [clearSession],
  )

  const startRecording = useCallback(
    async (conversationId: number) => {
      const existing = sessionRef.current
      if (existing?.conversationId === conversationId && existing.status === 'recording') {
        return
      }
      if (existing) {
        await clearSession()
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      recorder.start()

      const next: VoiceRecordingSession = {
        conversationId,
        recorder,
        stream,
        chunks,
        status: 'recording',
        seconds: 0,
      }
      syncSessionState(next)
      startTimer()
    },
    [clearSession, startTimer, syncSessionState],
  )

  const pauseRecording = useCallback(
    async (conversationId: number) => {
      const current = sessionRef.current
      if (!current || current.conversationId !== conversationId) return
      if (current.status === 'paused') return

      stopTimer()
      try {
        if (current.recorder.state === 'recording') current.recorder.pause()
      } catch {
        // Keep paused UI even if the recorder rejects pause.
      }

      syncSessionState({
        ...current,
        status: 'paused',
      })
    },
    [stopTimer, syncSessionState],
  )

  const resumeRecording = useCallback(
    async (conversationId: number) => {
      const current = sessionRef.current
      if (!current || current.conversationId !== conversationId) return
      if (current.status !== 'paused') return

      if (current.recorder.state === 'paused') {
        current.recorder.resume()
      }
      syncSessionState({
        ...current,
        status: 'recording',
      })
      startTimer()
    },
    [startTimer, syncSessionState],
  )

  const finishRecording = useCallback(
    async (conversationId: number) => {
      const current = sessionRef.current
      if (!current || current.conversationId !== conversationId) return null

      stopTimer()
      const { recorder, stream, chunks } = current
      sessionRef.current = null
      setSession(null)

      try {
        const blob = await new Promise<Blob>((resolve, reject) => {
          recorder.onstop = () => {
            resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
          }
          recorder.onerror = () => reject(new Error('Recording file missing'))
          if (recorder.state === 'paused') {
            try {
              recorder.resume()
            } catch {
              // stop() below still finalizes the recording on most browsers.
            }
          }
          if (recorder.state !== 'inactive') recorder.stop()
          else resolve(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }))
        })
        stopStream(stream)
        if (!blob.size) return null
        return new File([blob], `voice-${Date.now()}.webm`, { type: blob.type || 'audio/webm' })
      } catch {
        stopStream(stream)
        return null
      }
    },
    [stopTimer],
  )

  const getSession = useCallback((conversationId: number) => {
    const current = sessionRef.current
    if (!current || current.conversationId !== conversationId) return null
    return {
      conversationId: current.conversationId,
      status: current.status,
      seconds: current.seconds,
    }
  }, [])

  useEffect(() => {
    const onVisibility = () => {
      const current = sessionRef.current
      if (document.visibilityState === 'hidden' && current?.status === 'recording') {
        void pauseRecording(current.conversationId)
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      void clearSession()
    }
  }, [clearSession, pauseRecording])

  const value = useMemo(
    () => ({
      session,
      getSession,
      startRecording,
      pauseRecording,
      resumeRecording,
      cancelRecording,
      finishRecording,
    }),
    [
      session,
      getSession,
      startRecording,
      pauseRecording,
      resumeRecording,
      cancelRecording,
      finishRecording,
    ],
  )

  return (
    <ChatVoiceRecordingContext.Provider value={value}>{children}</ChatVoiceRecordingContext.Provider>
  )
}

export function useChatVoiceRecording() {
  const ctx = useContext(ChatVoiceRecordingContext)
  if (!ctx) {
    throw new Error('useChatVoiceRecording must be used within ChatVoiceRecordingProvider')
  }
  return ctx
}
