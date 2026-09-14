'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { RazorpayCheckout, type RazorpayPaymentResult } from '@/components/payments/RazorpayCheckout'
import { PlanCard } from '@/components/subscription/PlanCard'
import { Button } from '@/components/ui/Button'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { SubscriptionPlanCardsSkeleton } from '@/components/ui/Skeleton'
import {
  createSubscriptionCheckout,
  fetchSubscriptionPricing,
  verifySubscriptionPayment,
  type SubscriptionCheckoutData,
  type SubscriptionPricingData,
} from '@/core/api/subscriptions'
import { getErrorMessage } from '@/core/lib/api-error'
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from '@/core/lib/support-contact'
import {
  BUSINESS_FEATURES,
  STARTER_FEATURES,
  formatSubscriptionExpiry,
  getBusinessPriceLabel,
  getPlanLabel,
  getStorePlan,
  hasPremiumAccess,
  isCurrentPlan,
  type SubscriptionPlan,
} from '@/core/lib/subscription'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SubscriptionPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { store, refreshStore } = useStore()
  const [subscribing, setSubscribing] = useState(false)
  const [pricing, setPricing] = useState<SubscriptionPricingData | null>(null)
  const [pricingLoading, setPricingLoading] = useState(true)
  const [checkoutSession, setCheckoutSession] = useState<SubscriptionCheckoutData | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('starter')
  const [error, setError] = useState<string | null>(null)
  const premium = hasPremiumAccess(store)
  const currentPlan = getStorePlan(store)
  const expiryLabel = formatSubscriptionExpiry(store?.subscription_expires_at)
  const onBusinessPlan = isCurrentPlan(store, 'business')
  const onStarterPlan = isCurrentPlan(store, 'starter')

  const businessPrice = premium ? getBusinessPriceLabel(store) : pricing?.price_label
  const businessCompareAtPrice = !premium && pricing?.trial_eligible ? pricing.compare_at_label : undefined
  const businessTone =
    !premium && pricing?.trial_eligible ? ('trial-offer' as const) : ('default' as const)

  useEffect(() => {
    setSelectedPlan(currentPlan)
  }, [currentPlan, store?.id])

  useEffect(() => {
    if (premium || !store?.id) {
      setPricing(null)
      setPricingLoading(false)
      return
    }

    setPricingLoading(true)
    void fetchSubscriptionPricing(store.id)
      .then(setPricing)
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false))
  }, [premium, store?.id])

  const handleSubscribe = async () => {
    if (!store?.id) return
    setError(null)
    setSubscribing(true)
    try {
      const checkout = await createSubscriptionCheckout(store.id)
      setCheckoutSession(checkout)
    } catch (e) {
      const message = e instanceof Error ? e.message : ''
      if (/cancel/i.test(message)) return
      setError(getErrorMessage(e, 'Could not start checkout'))
    } finally {
      setSubscribing(false)
    }
  }

  const handlePaymentSuccess = async (payment: RazorpayPaymentResult) => {
    if (!checkoutSession) return
    setSubscribing(true)
    setError(null)
    try {
      await verifySubscriptionPayment({
        checkout_id: checkoutSession.checkout_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_signature: payment.razorpay_signature,
      })
      setCheckoutSession(null)
      await refreshStore()
      router.replace('/subscription-success')
    } catch (e) {
      setError(getErrorMessage(e, 'Payment received but activation failed. Contact support.'))
    } finally {
      setSubscribing(false)
    }
  }

  const subscribeLabel = !pricing?.trial_eligible ? 'Subscribe' : 'Start trial'
  const showPlanCards = premium || !pricingLoading
  const businessPriceLabel = businessPrice ?? getBusinessPriceLabel(store)

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Subscription"
        subtitle={premium ? 'Your active plan' : 'Choose the plan that fits your store'}
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-5 px-5 pb-10 pt-2">
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        {premium ? (
          <div className="rounded-[28px] border-2 border-brand-green bg-[#E8F8EC] px-6 py-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-brand-green">
                  Active plan
                </p>
                <h2 className="text-2xl font-extrabold tracking-tight text-black">
                  {getPlanLabel(currentPlan)}
                </h2>
                {expiryLabel ? (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[#EF4444]">
                      <MenuIcon name="calendar" className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[15px] font-semibold text-[#EF4444]">Valid until {expiryLabel}</p>
                  </div>
                ) : null}
                <p className="mt-2 text-[13px] leading-5 text-gray-500">
                  Your subscription stays active through the end of this date.
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/15 text-brand-green">
                <MenuIcon name="check" className="h-[18px] w-[18px]" />
              </div>
            </div>
          </div>
        ) : store ? (
          <p className="text-[14px] leading-5 text-gray-500">
            Current plan: <span className="font-semibold text-ink">{getPlanLabel(currentPlan)}</span>
          </p>
        ) : null}

        {!showPlanCards ? (
          <SubscriptionPlanCardsSkeleton count={2} />
        ) : (
          <>
            {!premium ? (
              <PlanCard
                emoji="🆓"
                title="Starter"
                price="₹0 / month"
                features={STARTER_FEATURES}
                isCurrent={onStarterPlan}
                selected={selectedPlan === 'starter'}
                tone={onStarterPlan ? 'starter-limited' : 'default'}
                onPress={() => setSelectedPlan('starter')}
              />
            ) : null}

            <PlanCard
              emoji="🚀"
              title="AiShopy Business"
              price={businessPriceLabel}
              compareAtPrice={businessCompareAtPrice}
              subtitle={premium ? undefined : 'Everything in Starter +'}
              features={BUSINESS_FEATURES}
              selected={selectedPlan === 'business'}
              tone={businessTone}
              isCurrent={onBusinessPlan}
              onPress={() => setSelectedPlan('business')}
              footer={
                onBusinessPlan ? (
                  <Button
                    label="Renew plan"
                    onClick={() => void handleSubscribe()}
                    loading={subscribing}
                  />
                ) : !premium ? (
                  <Button
                    label={subscribeLabel}
                    onClick={() => void handleSubscribe()}
                    loading={subscribing}
                  />
                ) : null
              }
            />
          </>
        )}

        <div className="flex flex-col gap-3 px-1">
          <p className="text-[13px] leading-5 text-gray-500">
            Auto-renewable subscription: AiShopy Business. Length: 1 month. Price: {businessPriceLabel}.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] font-semibold text-brand-primary underline"
            >
              Privacy Policy
            </a>
            <a
              href={TERMS_OF_USE_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[14px] font-semibold text-brand-primary underline"
            >
              Terms of Use
            </a>
            <button
              type="button"
              onClick={() => router.push('/ai-privacy')}
              className="text-[14px] font-semibold text-brand-primary underline"
            >
              AI & data privacy
            </button>
          </div>
        </div>
      </div>

      <RazorpayCheckout
        open={checkoutSession !== null}
        checkout={
          checkoutSession
            ? {
                key_id: checkoutSession.key_id,
                order_id: checkoutSession.order_id,
                amount: checkoutSession.amount,
                currency: checkoutSession.currency,
                store_name: checkoutSession.store_name,
              }
            : null
        }
        customerEmail={user?.email}
        customerPhone={store?.whatsapp_number ?? undefined}
        customerName={store?.name}
        description={
          checkoutSession?.is_trial ? 'Business plan — 1st month trial' : 'Business plan — 1 month'
        }
        onSuccess={(payment) => void handlePaymentSuccess(payment)}
        onDismiss={() => setCheckoutSession(null)}
      />
    </main>
  )
}
