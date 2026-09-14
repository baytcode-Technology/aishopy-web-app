'use client'

import type { ChatMessage } from '@/core/types/chat'

type Props = {
  visible: boolean
  message: ChatMessage | null
  onClose: () => void
  onForward: (message: ChatMessage) => void
}

export function ChatMessageActionsSheet({ visible, message, onClose, onForward }: Props) {
  if (!visible || !message) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full rounded-t-2xl bg-surface px-4 pb-8 pt-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 h-1 w-10 self-center rounded-full bg-gray-300 mx-auto" />
        <button
          type="button"
          className="flex w-full items-center gap-3 border-b border-gray-100 py-3.5 text-left"
          onClick={() => {
            onForward(message)
            onClose()
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-[18px] w-[18px] text-brand-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11Z" />
            </svg>
          </div>
          <span className="text-base font-semibold text-ink">Forward</span>
        </button>
        <button type="button" className="mt-2 w-full py-3 text-base text-gray-500" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
