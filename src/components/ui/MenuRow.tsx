'use client'

import { MenuIcon, type MenuIconName } from '@/components/ui/MenuIcons'
import type { ReactNode } from 'react'

type Props = {
  label: string
  value?: string | ReactNode
  icon?: MenuIconName
  onPress?: () => void
  showChevron?: boolean
  className?: string
}

export function MenuRow({
  label,
  value,
  icon = 'cog',
  onPress,
  showChevron = false,
  className = '',
}: Props) {
  const content = (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-gray-200 bg-surface px-5 py-4 ${className}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-brand-primary">
        <MenuIcon name={icon} className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          {label}
        </p>
        {value ? (
          typeof value === 'string' ? (
            <p className="text-[15px] font-semibold text-ink">{value}</p>
          ) : (
            value
          )
        ) : null}
      </div>
      {showChevron ? (
        <MenuIcon name="chevron-right" className="h-3 w-3 shrink-0 text-gray-400" />
      ) : null}
    </div>
  )

  if (onPress) {
    return (
      <button type="button" onClick={onPress} className="w-full text-left hover:opacity-90">
        {content}
      </button>
    )
  }

  return content
}
