'use client'

import { AdminUserCard } from '@/components/admin/AdminUserCard'
import { AdminUsersFilterChips } from '@/components/admin/AdminUsersFilterChips'
import { AdminUsersFilterModal } from '@/components/admin/AdminUsersFilterModal'
import { OrderSearchBar } from '@/components/orders/order-create/OrderSearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderRowSkeleton } from '@/components/ui/Skeleton'
import { fetchPlatformAdminUsers } from '@/core/api/platform-admin-users'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  formatRelativeTime,
  hasActiveAdminUsersFilters,
  type AdminUsersFilters,
} from '@/core/lib/admin-users-filters'
import type {
  AdminHasStoreFilter,
  AdminPlanFilter,
  AdminSignedAfterFilter,
  PlatformAdminUserCard,
} from '@/core/types/platform-admin-users'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

const PAGE_SIZE = 20

function parseFilters(params: URLSearchParams): AdminUsersFilters {
  const hasStore = params.get('hasStore')
  const plan = params.get('plan')
  const signedAfter = params.get('signedAfter')
  return {
    hasStore: hasStore === 'yes' || hasStore === 'no' ? hasStore : null,
    plan:
      plan === 'starter' || plan === 'business' || plan === 'enterprise'
        ? plan
        : plan === 'free'
          ? 'starter'
          : null,
    signedAfter:
      signedAfter === '7d' || signedAfter === '30d' || signedAfter === '90d' ? signedAfter : null,
  }
}

export function AdminUsersDirectory() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])
  const q = searchParams.get('q') ?? ''
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const [searchDraft, setSearchDraft] = useState(q)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<PlatformAdminUserCard[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setSearchDraft(q)
  }, [q])

  const writeParams = useCallback(
    (patch: {
      q?: string
      hasStore?: AdminHasStoreFilter | null
      plan?: AdminPlanFilter | null
      signedAfter?: AdminSignedAfterFilter | null
      page?: number
    }) => {
      const next = new URLSearchParams(searchParams.toString())

      const nextQ = patch.q !== undefined ? patch.q : q
      if (nextQ.trim()) next.set('q', nextQ.trim())
      else next.delete('q')

      const nextHasStore = patch.hasStore !== undefined ? patch.hasStore : filters.hasStore
      if (nextHasStore) next.set('hasStore', nextHasStore)
      else next.delete('hasStore')

      const nextPlan = patch.plan !== undefined ? patch.plan : filters.plan
      if (nextPlan) next.set('plan', nextPlan)
      else next.delete('plan')

      const nextSigned = patch.signedAfter !== undefined ? patch.signedAfter : filters.signedAfter
      if (nextSigned) next.set('signedAfter', nextSigned)
      else next.delete('signedAfter')

      const nextPage = patch.page ?? page
      if (nextPage > 1) next.set('page', String(nextPage))
      else next.delete('page')

      const qs = next.toString()
      router.replace(qs ? `/platform-admin/workspace/users?${qs}` : '/platform-admin/workspace/users')
    },
    [filters.hasStore, filters.plan, filters.signedAfter, page, q, router, searchParams],
  )

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === q) return
      writeParams({ q: searchDraft, page: 1 })
    }, 300)
    return () => window.clearTimeout(handle)
  }, [q, searchDraft, writeParams])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPlatformAdminUsers({
        q: q || undefined,
        hasStore: filters.hasStore ?? undefined,
        plan: filters.plan ?? undefined,
        signedAfter: filters.signedAfter ?? undefined,
        page,
        limit: PAGE_SIZE,
      })
      setUsers(res.data.users)
      setTotal(res.data.total)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load users'))
    } finally {
      setLoading(false)
    }
  }, [filters.hasStore, filters.plan, filters.signedAfter, page, q])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const filtersActive = hasActiveAdminUsersFilters(filters)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2.5 px-0 py-1">
        <div className="flex-1">
          <OrderSearchBar
            value={searchDraft}
            onChange={setSearchDraft}
            placeholder="Search email, store, or phone"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filter users"
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
            filtersActive ? 'border-ink bg-gray-100' : 'border-gray-200 bg-gray-50'
          }`}
        >
          <svg
            className={`h-[18px] w-[18px] ${filtersActive ? 'text-ink' : 'text-gray-500'}`}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <path d="M3 5h18l-7 8v5l-4 2v-7L3 5Z" />
          </svg>
        </button>
      </div>

      <AdminUsersFilterChips
        filters={filters}
        onRemove={(key) => writeParams({ [key]: null, page: 1 })}
        onClearAll={() =>
          writeParams({
            hasStore: null,
            plan: null,
            signedAfter: null,
            page: 1,
          })
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((index) => (
            <OrderRowSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Could not load users" description={error} />
      ) : users.length === 0 ? (
        <EmptyState
          icon="search"
          title="No users match"
          description="Try a different search or clear filters."
        />
      ) : (
        <>
          <p className="px-1 text-[12px] font-semibold text-gray-400">
            {total} user{total === 1 ? '' : 's'}
          </p>
          <div className="flex flex-col gap-3">
            {users.map((user) => (
              <AdminUserCard
                key={user.id}
                user={user}
                relativeSignup={formatRelativeTime(user.created_at)}
                onPress={() => router.push(`/platform-admin/users/${user.id}`)}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <div className="mt-2 flex items-center justify-between px-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => writeParams({ page: page - 1 })}
                className="text-[13px] font-semibold text-gray-500 disabled:opacity-40"
              >
                Previous
              </button>
              <p className="text-[12px] font-medium text-gray-400">
                Page {page} of {totalPages}
              </p>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => writeParams({ page: page + 1 })}
                className="text-[13px] font-semibold text-gray-500 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      )}

      <AdminUsersFilterModal
        open={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) =>
          writeParams({
            hasStore: next.hasStore,
            plan: next.plan,
            signedAfter: next.signedAfter,
            page: 1,
          })
        }
      />
    </div>
  )
}
