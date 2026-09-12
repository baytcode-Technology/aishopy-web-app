import type { Store } from '@/core/types/store'

export type SubscriptionPlan = 'starter' | 'business' | 'enterprise'

const PLAN_LABELS: Record<SubscriptionPlan, string> = {
  starter: 'Starter',
  business: 'Business',
  enterprise: 'Enterprise',
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})/

export function normalizeSubscriptionDate(expiresAt: string): string {
  const match = DATE_ONLY_RE.exec(expiresAt.trim())
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`
  }

  const date = new Date(expiresAt)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getSubscriptionExpiryEndMs(expiresAt: string): number {
  const [year, month, day] = normalizeSubscriptionDate(expiresAt).split('-').map(Number)
  return Date.UTC(year, month - 1, day, 23, 59, 59, 999)
}

export function getPlanLabel(plan: SubscriptionPlan): string {
  return PLAN_LABELS[plan]
}

export function isPremiumPlan(plan: SubscriptionPlan): boolean {
  return plan === 'business' || plan === 'enterprise'
}

export function isSubscriptionExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return Date.now() > getSubscriptionExpiryEndMs(expiresAt)
}

export function hasPremiumAccess(
  store: Pick<Store, 'subscription_plan' | 'subscription_expires_at'> | null | undefined,
): boolean {
  if (!store) return false
  const plan = store.subscription_plan ?? 'starter'
  if (!isPremiumPlan(plan)) return false
  return !isSubscriptionExpired(store.subscription_expires_at)
}

export function getStorePlan(
  store: Pick<Store, 'subscription_plan'> | null | undefined,
): SubscriptionPlan {
  return store?.subscription_plan ?? 'starter'
}
