'use client'

import { Button } from '@/components/ui/Button'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { formatSubscriptionExpiry, getPlanLabel, getStorePlan } from '@/core/lib/subscription'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'

export default function SubscriptionSuccessPage() {
  const router = useRouter()
  const { store } = useStore()
  const currentPlan = getStorePlan(store)
  const expiryLabel = formatSubscriptionExpiry(store?.subscription_expires_at)

  const goToSubscription = () => {
    router.replace('/subscription')
  }

  return (
    <main className="flex min-h-full flex-col bg-gray-100 px-6 pb-8">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#E8F8EC] text-brand-green shadow-sm">
          <MenuIcon name="check" className="h-10 w-10" />
        </div>

        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-green">
          Payment successful
        </p>
        <h1 className="text-center text-[28px] font-extrabold tracking-tight text-ink">
          You&apos;re on {getPlanLabel(currentPlan)}
        </h1>
        <p className="mt-3 max-w-[300px] text-center text-[15px] leading-6 text-gray-500">
          Your subscription is active. Premium features are unlocked for your store.
        </p>

        <div className="mt-8 w-full rounded-[28px] border-2 border-brand-green bg-[#E8F8EC] px-6 py-5 shadow-sm">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-green">
            Active plan
          </p>
          <p className="text-2xl font-extrabold text-ink">{getPlanLabel(currentPlan)}</p>
          {expiryLabel ? (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[#EF4444]">
                <MenuIcon name="calendar" className="h-3.5 w-3.5" />
              </span>
              <p className="text-[15px] font-semibold text-[#EF4444]">Valid until {expiryLabel}</p>
            </div>
          ) : null}
        </div>
      </div>

      <Button label="View subscription" onClick={goToSubscription} />
    </main>
  )
}
