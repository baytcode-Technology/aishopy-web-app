'use client'

import type { ReactNode, RefObject } from 'react'

type Props = {
  children: ReactNode
  composer: ReactNode
  footer?: ReactNode
  listRef?: RefObject<HTMLDivElement | null>
}

export function SupportKeyboardChatLayout({ children, composer, footer, listRef }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      {footer}
      <div className="border-t border-gray-200 bg-surface">{composer}</div>
    </div>
  )
}
