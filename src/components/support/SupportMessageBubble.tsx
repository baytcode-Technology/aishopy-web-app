'use client'

import { FormattedMessageText } from '@/core/lib/parse-inline-markdown'
import type { SupportMessage } from '@/core/types/support'

type Props = {
  message: SupportMessage
}

export function SupportMessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  const isAdmin = message.role === 'admin'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="mb-3 w-full px-2">
        <div className="mx-auto max-w-[95%] self-center rounded-full border border-gray-200 bg-gray-100 px-4 py-2">
          <FormattedMessageText
            text={message.content}
            className="text-center text-[12px] leading-4 text-gray-600"
          />
        </div>
        <p className="mt-1 text-center text-[12px] text-gray-400">{message.time}</p>
      </div>
    )
  }

  return (
    <div className={`mb-3 max-w-[82%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
      {isAdmin ? (
        <p className="mb-1 ml-1 text-[10px] uppercase tracking-wider text-brand-green">AiShopy team</p>
      ) : null}
      <div
        className={`flex flex-col gap-1 rounded-2xl px-3.5 py-2.5 ${
          isUser ? 'bg-brand-green' : 'border border-gray-200 bg-surface'
        }`}
      >
        {isUser ? (
          <p className="text-[15px] leading-[21px] text-brand-on-primary">{message.content}</p>
        ) : (
          <FormattedMessageText text={message.content} className="text-[15px] leading-[21px] text-ink" />
        )}
        <p className="self-end text-[12px] text-gray-400">{message.time}</p>
      </div>
    </div>
  )
}
