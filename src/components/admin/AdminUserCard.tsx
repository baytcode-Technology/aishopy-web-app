import { planLabel } from '@/core/lib/admin-users-filters'
import type { AdminStorePlan, PlatformAdminUserCard } from '@/core/types/platform-admin-users'

function planBadgeClass(plan: AdminStorePlan | null, premiumActive: boolean): string {
  if (!plan) return 'bg-gray-100 text-gray-600'
  if (plan === 'enterprise') return 'bg-ink text-white'
  if (plan === 'business') {
    return premiumActive ? 'bg-[#E8F8EC] text-brand-green' : 'bg-amber-50 text-amber-800'
  }
  return 'bg-gray-100 text-gray-600'
}

type Props = {
  user: PlatformAdminUserCard
  relativeSignup: string
  onPress: () => void
}

export function AdminUserCard({ user, relativeSignup, onPress }: Props) {
  const storeLine = user.has_store
    ? [user.primary_store_name, user.primary_store_phone].filter(Boolean).join(' · ')
    : 'No store yet'

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full rounded-[22px] border border-gray-200 bg-surface px-5 py-4 text-left shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{user.email ?? 'No email'}</p>
          <p className="mt-0.5 text-[13px] text-gray-500">{user.phone ?? 'No phone'}</p>
          <p className="mt-2 truncate text-[13px] leading-5 text-gray-500">{storeLine}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${planBadgeClass(
              user.rollup_plan,
              user.premium_active,
            )}`}
          >
            {user.has_store ? planLabel(user.rollup_plan) : 'No store'}
          </span>
          <p className="text-xs font-medium text-gray-400">{relativeSignup}</p>
          {user.store_count > 1 ? (
            <p className="text-[10px] font-medium text-gray-400">{user.store_count} stores</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}
