'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { useSupportAdminSummary } from '@/hooks/useSupportAdminSummary'
import { useRouter } from 'next/navigation'

export function PlatformAdminSupportBanner() {
  const router = useRouter()
  const { summary } = useSupportAdminSummary(true)
  const openTickets = summary.escalated_count
  const unreadOnTickets = summary.unread_messages

  return (
    <button
      type="button"
      onClick={() => router.push('/platform-admin/workspace/support')}
      className="mb-3 flex w-full items-center gap-3 rounded-2xl border-2 border-brand-green/40 bg-[#E8F8EC] px-4 py-3 text-left"
    >
      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-green">
        <MenuIcon name="inbox" className="h-4 w-4 text-brand-on-primary" />
        {unreadOnTickets > 0 ? (
          <span className="absolute -right-2 -top-1">
            <UnreadCountBadge count={unreadOnTickets} />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-[14px] font-semibold text-ink">Merchant support inbox</p>
          {openTickets > 0 ? (
            <span className="text-[10px] font-bold uppercase text-brand-green">
              {openTickets} open
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] leading-4 text-gray-500">
          {unreadOnTickets > 0
            ? `${unreadOnTickets} unread on open tickets`
            : openTickets > 0
              ? `${openTickets} ticket${openTickets === 1 ? '' : 's'} need attention`
              : 'AiShopy Chat with AI threads from merchants'}
        </p>
      </div>
      <MenuIcon name="chevron-right" className="h-3 w-3 text-brand-green" />
    </button>
  )
}
