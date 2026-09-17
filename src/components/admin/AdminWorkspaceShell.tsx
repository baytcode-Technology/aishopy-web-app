'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { useSupportAdminSummary } from '@/hooks/useSupportAdminSummary'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const NAV = [
  {
    href: '/platform-admin/workspace/support',
    label: 'Support inbox',
    icon: 'inbox' as const,
  },
  {
    href: '/platform-admin/workspace/users',
    label: 'Users',
    icon: 'users' as const,
  },
] as const

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

type Props = {
  children: ReactNode
}

export function AdminWorkspaceShell({ children }: Props) {
  const pathname = usePathname()
  const { summary } = useSupportAdminSummary(true)
  const unreadOnTickets = summary.unread_messages

  return (
    <div className="min-h-full bg-gray-100 lg:flex lg:h-full lg:min-h-0 lg:overflow-hidden">
      <aside className="hidden lg:flex lg:h-full lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-surface">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <div className="px-5 pb-2 pt-6">
            <AppLogo />
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">
              Platform admin
            </p>
            <p className="mt-1 text-[15px] font-semibold text-ink">AiShopy support</p>
          </div>
          <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
            {NAV.map(({ href, label, icon }) => {
              const active = isActive(pathname, href)
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[14px] font-semibold ${
                    active ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-ink'
                  }`}
                >
                  <span className="relative">
                    <MenuIcon
                      name={icon}
                      className={`h-5 w-5 ${active ? 'text-ink' : 'text-gray-400'}`}
                    />
                    {href.includes('/support') && unreadOnTickets > 0 ? (
                      <UnreadCountBadge count={unreadOnTickets} className="absolute -right-2 -top-1" />
                    ) : null}
                  </span>
                  {label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto border-t border-gray-200 px-3 py-4">
            <Link
              href="/platform-admin"
              className="block rounded-2xl px-3 py-2.5 text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
            >
              Back to admin home
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-h-full flex-1 flex-col pb-24 lg:min-h-0 lg:overflow-y-auto lg:pb-0">
        {children}
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-20 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
        <div className="flex items-center justify-between rounded-[26px] border border-gray-200 bg-surface px-2 py-2 shadow-lg">
          {NAV.map(({ href, label, icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-w-[56px] flex-1 flex-col items-center rounded-[18px] px-2 py-1.5 ${
                  active ? 'bg-gray-100' : ''
                }`}
              >
                <span className="relative">
                  <MenuIcon
                    name={icon}
                    className={`h-5 w-5 ${active ? 'text-ink' : 'text-gray-400'}`}
                  />
                  {href.includes('/support') && unreadOnTickets > 0 ? (
                    <UnreadCountBadge count={unreadOnTickets} className="absolute -right-2 -top-1" />
                  ) : null}
                </span>
                <span
                  className={`mt-1 text-center text-[10px] font-bold tracking-wide ${
                    active ? 'text-ink' : 'text-gray-400'
                  }`}
                >
                  {label === 'Support inbox' ? 'Inbox' : label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
