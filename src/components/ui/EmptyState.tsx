import type { ReactNode } from 'react'
import { Body, Heading } from '@/components/ui/Typography'

type EmptyIcon = 'inbox' | 'shopping-cart' | 'search'

type Props = {
  icon?: EmptyIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

function EmptyIconMark({ icon }: { icon: EmptyIcon }) {
  if (icon === 'search') {
    return (
      <svg className="h-[26px] w-[26px] text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z" />
      </svg>
    )
  }

  if (icon === 'shopping-cart') {
    return (
      <svg className="h-[26px] w-[26px] text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM6.2 6l.4 2h12.7l-1.3 6H8.1L6.2 6ZM4 4H2V2h3l.6 3h14.7l1.9 9H7.4L5.7 6.2 5.2 4H4Z" />
      </svg>
    )
  }

  return (
    <svg className="h-[26px] w-[26px] text-gray-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20 6h-4V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a2 2 0 0 0-2-2ZM10 4h4v2h-4V4Zm10 15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8h16v11Z" />
    </svg>
  )
}

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
  className = '',
}: Props) {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center px-10 py-20 ${className}`}>
      <div className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] border border-gray-200 bg-surface shadow-sm">
        <EmptyIconMark icon={icon} />
      </div>
      <Heading as="h2" className="text-center">
        {title}
      </Heading>
      {description ? (
        <Body as="p" className="mt-3 max-w-[300px] text-center text-gray-500">
          {description}
        </Body>
      ) : null}
      {action ? <div className="mt-8 w-full max-w-xs">{action}</div> : null}
    </div>
  )
}
