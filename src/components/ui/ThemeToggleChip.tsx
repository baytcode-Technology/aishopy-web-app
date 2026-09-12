'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { useAppTheme } from '@/providers/theme-provider'

type Props = {
  className?: string
}

/** Moon/sun chip — same styling as Settings Edit button. */
export function ThemeToggleChip({ className = '' }: Props) {
  const { isDark, toggleTheme } = useAppTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-brand-primary ${className}`}
    >
      <MenuIcon name={isDark ? 'sun-o' : 'moon-o'} className="h-3 w-3" />
    </button>
  )
}
