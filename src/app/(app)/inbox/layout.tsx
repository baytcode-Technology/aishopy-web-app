'use client'

import { ChatVoiceRecordingProvider } from '@/providers/chat-voice-recording-provider'
import type { ReactNode } from 'react'

export default function InboxLayout({ children }: { children: ReactNode }) {
  return <ChatVoiceRecordingProvider>{children}</ChatVoiceRecordingProvider>
}
