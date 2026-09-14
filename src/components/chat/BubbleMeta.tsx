'use client'

import type { ChatMessage } from '@/core/types/chat'
import { useAppTheme } from '@/providers/theme-provider'

type Props = {
  message: ChatMessage
  outgoing: boolean
  overlay?: boolean
}

function statusLabel(message: ChatMessage): string | null {
  if (message.pending || message.status === 'pending') return 'sending…'
  if (!message.status || message.status === 'received') return null
  if (message.status === 'failed') return 'failed'
  return message.status
}

export function BubbleMeta({ message, outgoing, overlay }: Props) {
  const status = outgoing ? statusLabel(message) : null
  const { isDark } = useAppTheme()

  return (
    <p
      className={`self-end text-[11px] font-medium ${
        overlay
          ? 'text-white/90'
          : outgoing
            ? isDark
              ? 'text-white/90'
              : 'text-gray-400'
            : 'text-gray-400'
      }`}
    >
      {message.time}
      {status ? ` · ${status}` : ''}
    </p>
  )
}
