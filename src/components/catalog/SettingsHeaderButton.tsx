'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import Link from 'next/link'

export function SettingsHeaderButton() {
  return (
    <Link
      href="/settings"
      aria-label="Settings"
      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-brand-primary"
    >
      <MenuIcon name="cog" className="h-4 w-4" />
    </Link>
  )
}
