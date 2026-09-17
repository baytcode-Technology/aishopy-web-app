import type {
  AdminHasStoreFilter,
  AdminPlanFilter,
  AdminSignedAfterFilter,
  AdminStorePlan,
} from '@/core/types/platform-admin-users'

export type AdminUsersFilters = {
  hasStore: AdminHasStoreFilter | null
  plan: AdminPlanFilter | null
  signedAfter: AdminSignedAfterFilter | null
}

export const EMPTY_ADMIN_USERS_FILTERS: AdminUsersFilters = {
  hasStore: null,
  plan: null,
  signedAfter: null,
}

export function hasActiveAdminUsersFilters(filters: AdminUsersFilters): boolean {
  return Boolean(filters.hasStore || filters.plan || filters.signedAfter)
}

export function planLabel(plan: AdminStorePlan | AdminPlanFilter | null | undefined): string {
  if (!plan) return 'No plan'
  if (plan === 'starter') return 'Starter'
  if (plan === 'business') return 'Business'
  return 'Enterprise'
}

export function signedAfterLabel(value: AdminSignedAfterFilter): string {
  if (value === '7d') return 'Last 7 days'
  if (value === '30d') return 'Last 30 days'
  return 'Last 90 days'
}

export function hasStoreLabel(value: AdminHasStoreFilter): string {
  return value === 'yes' ? 'Has a store' : 'No store yet'
}

export type AdminUsersFilterChip = {
  key: keyof AdminUsersFilters
  label: string
}

export function getAdminUsersFilterChips(filters: AdminUsersFilters): AdminUsersFilterChip[] {
  const chips: AdminUsersFilterChip[] = []
  if (filters.hasStore) {
    chips.push({ key: 'hasStore', label: hasStoreLabel(filters.hasStore) })
  }
  if (filters.plan) {
    chips.push({ key: 'plan', label: planLabel(filters.plan) })
  }
  if (filters.signedAfter) {
    chips.push({ key: 'signedAfter', label: signedAfterLabel(filters.signedAfter) })
  }
  return chips
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString()
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    return `${currency} ${amount}`
  }
}
