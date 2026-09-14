import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import type { ReactNode } from 'react'

type Props = {
  onClick: () => void
  label?: string
  badgeCount?: number
  children?: ReactNode
}

export function Fab({ onClick, label = 'Create', badgeCount = 0, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-24 right-5 z-10 flex h-[60px] w-[60px] items-center justify-center rounded-full border border-brand-primary bg-brand-primary text-2xl font-semibold text-brand-on-primary shadow-lg lg:bottom-8"
    >
      {children ?? '+'}
      {badgeCount > 0 ? (
        <span className="absolute -right-1 -top-1">
          <UnreadCountBadge count={badgeCount} />
        </span>
      ) : null}
    </button>
  )
}
