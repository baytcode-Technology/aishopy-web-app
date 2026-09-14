'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { MenuRow } from '@/components/ui/MenuRow'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { useSupportAdminSummary } from '@/hooks/useSupportAdminSummary'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function PlatformAdminPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { clearStore } = useStore()
  const { summary, refresh } = useSupportAdminSummary(true)

  useEffect(() => {
    void refresh()
  }, [refresh])

  const openTickets = summary.escalated_count
  const unreadOnTickets = summary.unread_messages

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Admin"
        subtitle="AiShopy platform support"
        showSettings={false}
      />
      <div className="flex flex-col gap-4 px-5 pb-8 pt-2">
        <div className="rounded-[28px] border border-gray-200 bg-surface px-6 py-5 shadow-sm">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
            Signed in
          </p>
          <p className="text-[15px] text-gray-500">{user?.email ?? 'Admin account'}</p>
          <p className="mt-2 text-[13px] leading-5 text-gray-500">
            Manage merchant Chat with AI threads. A store is optional for this account.
          </p>
        </div>

        <div className="relative">
          <MenuRow
            label="Support inbox"
            value={
              openTickets > 0
                ? `${openTickets} open ticket${openTickets === 1 ? '' : 's'}`
                : unreadOnTickets > 0
                  ? `${unreadOnTickets} unread message${unreadOnTickets === 1 ? '' : 's'} on tickets`
                  : 'AiShopy merchant Chat with AI'
            }
            icon="inbox"
            showChevron
            onPress={() => router.push('/platform-support-inbox')}
          />
          {unreadOnTickets > 0 ? (
            <div className="absolute right-5 top-3">
              <UnreadCountBadge count={unreadOnTickets} />
            </div>
          ) : null}
        </div>

        <MenuRow
          label="Create a store"
          value="Optional — run your own shop"
          icon="shopping-bag"
          showChevron
          onPress={() => router.push('/create-store')}
        />

        <div className="pt-4">
          <Button
            label="Sign out"
            onClick={() => void handleSignOut()}
            className="border-[#E11D48] bg-[#E11D48] text-white"
          />
        </div>
      </div>
    </main>
  )
}
