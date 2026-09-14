'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { fetchSupportAdminConversations } from '@/core/api/support'
import { getErrorMessage } from '@/core/lib/api-error'
import type { SupportAdminConversation } from '@/core/types/support'
import { usePlatformAdminBack } from '@/hooks/usePlatformAdminBack'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

type InboxFilter = 'tickets' | 'ai' | 'all'

function isOpenTicket(item: SupportAdminConversation) {
  return item.status === 'escalated'
}

function isAiChat(item: SupportAdminConversation) {
  return item.status === 'active'
}

function formatRelative(iso: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return d.toLocaleDateString()
}

function ConversationAdminRow({
  item,
  onPress,
}: {
  item: SupportAdminConversation
  onPress: () => void
}) {
  const isEscalated = item.status === 'escalated'
  const isManual = item.reply_mode === 'manual'

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full border-b border-gray-100 bg-surface px-5 py-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{item.store_name}</p>
          <p className="mt-0.5 truncate text-[13px] text-gray-500">{item.owner_email ?? 'Unknown owner'}</p>
          <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-gray-500">
            {item.last_message_preview ?? 'No messages yet'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="text-xs font-medium text-gray-400">{formatRelative(item.last_message_at)}</p>
          {isEscalated ? (
            <span className="rounded-full bg-[#E8F8EC] px-2 py-0.5 text-[10px] font-bold uppercase text-brand-green">
              {isManual ? 'Manual' : 'Open'}
            </span>
          ) : (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gray-600">
              AI
            </span>
          )}
          {isEscalated && item.ticket_code ? (
            <p className="text-[10px] font-medium text-gray-400">{item.ticket_code}</p>
          ) : null}
          {(item.unread_count ?? 0) > 0 ? <UnreadCountBadge count={item.unread_count ?? 0} /> : null}
        </div>
      </div>
    </button>
  )
}

function InboxFilterBar({
  filter,
  onChange,
  ticketCount,
  aiCount,
  allCount,
}: {
  filter: InboxFilter
  onChange: (next: InboxFilter) => void
  ticketCount: number
  aiCount: number
  allCount: number
}) {
  const tabs: { id: InboxFilter; label: string; count: number }[] = [
    { id: 'tickets', label: 'Tickets', count: ticketCount },
    { id: 'ai', label: 'AI', count: aiCount },
    { id: 'all', label: 'All', count: allCount },
  ]

  return (
    <div className="px-4 py-3">
      <div className="flex rounded-2xl border border-gray-200 bg-gray-100 p-1">
        {tabs.map((tab) => {
          const selected = filter === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-label={`${tab.label} filter`}
              onClick={() => onChange(tab.id)}
              className={`flex flex-1 items-center justify-center rounded-[14px] px-2 py-2.5 ${
                selected ? 'bg-surface' : ''
              }`}
            >
              <span className="text-[14px] font-semibold text-ink">{tab.label}</span>
              <span
                className={`ml-1.5 text-[12px] font-bold ${selected ? 'text-ink' : 'text-gray-500'}`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function PlatformSupportInboxPage() {
  const router = useRouter()
  const goBack = usePlatformAdminBack()
  const [items, setItems] = useState<SupportAdminConversation[]>([])
  const [filter, setFilter] = useState<InboxFilter>('tickets')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)
    try {
      const res = await fetchSupportAdminConversations()
      setItems(res.data.conversations)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load support inbox'))
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void load()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [load])

  const ticketItems = useMemo(() => items.filter((item) => isOpenTicket(item)), [items])
  const aiItems = useMemo(() => items.filter((item) => isAiChat(item)), [items])

  const filtered = useMemo(() => {
    if (filter === 'tickets') return ticketItems
    if (filter === 'ai') return aiItems
    return items
  }, [filter, items, ticketItems, aiItems])

  const unreadTotal = useMemo(
    () => ticketItems.reduce((sum, item) => sum + (item.unread_count ?? 0), 0),
    [ticketItems],
  )

  const emptyMessage = isLoading
    ? 'Loading conversations…'
    : filter === 'tickets'
      ? 'No open tickets right now'
      : filter === 'ai'
        ? 'No AI chats right now'
        : 'No support conversations right now'

  return (
    <main className="flex min-h-full flex-col bg-gray-100">
      <CatalogHeader
        title="Support inbox"
        subtitle={
          unreadTotal > 0
            ? `${unreadTotal} unread on open tickets`
            : `${ticketItems.length} open · ${aiItems.length} AI chats`
        }
        onBack={goBack}
        right={
          <button
            type="button"
            onClick={() => void load(true)}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Refresh"
          >
            <svg
              className={`h-4 w-4 text-brand-primary ${isRefreshing ? 'animate-spin' : ''}`}
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 13.65-6.65Z" />
            </svg>
          </button>
        }
      />
      <div className="flex flex-1 flex-col">
        {error ? <p className="px-5 pb-2 text-sm font-semibold text-[#E11D48]">{error}</p> : null}
        <InboxFilterBar
          filter={filter}
          onChange={setFilter}
          ticketCount={ticketItems.length}
          aiCount={aiItems.length}
          allCount={items.length}
        />

        <div className="flex-1 bg-surface">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center p-10">
              <MenuIcon name="inbox" className="h-7 w-7 text-gray-400" />
              <p className="mt-3 text-center text-sm text-gray-500">{emptyMessage}</p>
            </div>
          ) : (
            filtered.map((item) => (
              <ConversationAdminRow
                key={item.id}
                item={item}
                onPress={() => router.push(`/platform-support/${item.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </main>
  )
}
