'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { PaymentMethodStatusBadge } from '@/components/store/PaymentMethodStatusBadge'
import { MenuRow } from '@/components/ui/MenuRow'
import { PaymentMethodsListSkeleton } from '@/components/ui/Skeleton'
import { fetchPaymentConfig } from '@/core/api/payment-config'
import { getErrorMessage } from '@/core/lib/api-error'
import type { RazorpayMode } from '@/core/types/payment-config'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, type ReactNode } from 'react'

function paymentMethodValue(enabled: boolean, description: string, mode?: RazorpayMode): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <PaymentMethodStatusBadge enabled={enabled} mode={enabled ? mode : undefined} />
      <p className="text-[14px] font-normal leading-5 text-gray-600">{description}</p>
    </div>
  )
}

export default function PaymentMethodsPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const isOwner = role === 'owner'
  const [loading, setLoading] = useState(true)
  const [codEnabled, setCodEnabled] = useState(false)
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)
  const [razorpayMode, setRazorpayMode] = useState<RazorpayMode>('test')
  const [upiEnabled, setUpiEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPaymentConfig(store.id)
      const cfg = res.data.payment_config
      setCodEnabled(cfg.cod.enabled)
      setRazorpayEnabled(cfg.razorpay.enabled)
      setRazorpayMode(cfg.razorpay.mode)
      setUpiEnabled(cfg.upi.enabled)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load payment methods'))
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    void load()
  }, [load])

  const openMethod = (href: string) => {
    if (!isOwner) {
      setNotice('Only the store owner can change payment methods')
      return
    }
    router.push(href)
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Payment methods"
        subtitle="Checkout & payouts"
        onBack={() => router.back()}
        showSettings={false}
      />
      <div className="px-5 pb-10 pt-2">
        {notice ? <p className="mb-3 text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="mb-3 text-sm text-[#E11D48]">{error}</p> : null}
        <p className="mb-4 text-[14px] leading-5 text-gray-500">
          {isOwner
            ? 'Choose how customers pay at checkout. Connect and manage each method below.'
            : 'Payment methods used at checkout. Only the store owner can change them.'}
        </p>

        {loading ? (
          <PaymentMethodsListSkeleton />
        ) : (
          <div className="flex flex-col gap-3">
            <MenuRow
              label="Razorpay"
              value={paymentMethodValue(razorpayEnabled, 'Cards, wallets & netbanking', razorpayMode)}
              icon="credit-card"
              showChevron={isOwner}
              onPress={() => openMethod('/payment-methods/razorpay')}
            />
            <MenuRow
              label="Cash on delivery"
              value={paymentMethodValue(codEnabled, 'Pay when the order arrives')}
              icon="money"
              showChevron={isOwner}
              onPress={() => openMethod('/payment-methods/cod')}
            />
            <MenuRow
              label="UPI"
              value={paymentMethodValue(upiEnabled, 'Manual UPI ID & QR')}
              icon="mobile"
              showChevron={isOwner}
              onPress={() => openMethod('/payment-methods/upi')}
            />
          </div>
        )}
      </div>
    </main>
  )
}
