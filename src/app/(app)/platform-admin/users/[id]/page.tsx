'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { DetailSection } from '@/components/catalog/DetailSection'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrderRowSkeleton } from '@/components/ui/Skeleton'
import { fetchPlatformAdminUser } from '@/core/api/platform-admin-users'
import {
  formatDateTime,
  formatMoney,
  planLabel,
} from '@/core/lib/admin-users-filters'
import { getApiErrorCode, getErrorMessage } from '@/core/lib/api-error'
import type {
  PlatformAdminCheckoutSummary,
  PlatformAdminStoreSummary,
  PlatformAdminUserDetail,
} from '@/core/types/platform-admin-users'
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-3.5 last:border-b-0">
      <p className="shrink-0 text-[13px] font-medium text-gray-400">{label}</p>
      <p className="min-w-0 text-right text-[14px] font-semibold text-ink">{value}</p>
    </div>
  )
}

function Chip({ label, on }: { label: string; on: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
        on ? 'bg-[#E8F8EC] text-brand-green' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {label}
    </span>
  )
}

function latestPaidCheckout(
  storeId: number,
  subscriptions: PlatformAdminCheckoutSummary[],
): PlatformAdminCheckoutSummary | null {
  return (
    subscriptions.find((item) => item.store_id === storeId && item.status === 'paid') ??
    subscriptions.find((item) => item.store_id === storeId) ??
    null
  )
}

function StoreCard({
  store,
  checkout,
}: {
  store: PlatformAdminStoreSummary
  checkout: PlatformAdminCheckoutSummary | null
}) {
  return (
    <DetailSection>
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-start gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-[13px] font-bold text-gray-500">
              {store.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-ink">{store.name}</p>
            <p className="truncate text-[13px] text-gray-500">{store.storefront_url}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip label={`WhatsApp ${store.whatsapp_connected ? 'on' : 'off'}`} on={store.whatsapp_connected} />
          <Chip
            label={`Instagram ${store.instagram_connected ? 'on' : 'off'}`}
            on={store.instagram_connected}
          />
          <Chip label={`AI ${store.ai_auto_reply_enabled ? 'on' : 'off'}`} on={store.ai_auto_reply_enabled} />
          <Chip label={store.premium_active ? 'Premium active' : 'Premium off'} on={store.premium_active} />
        </div>
      </div>
      <Fact label="Store phone" value={store.phone ?? '—'} />
      <Fact label="Country / currency" value={`${store.country} · ${store.currency}`} />
      <Fact label="Industry" value={store.industry ?? '—'} />
      <Fact label="Created" value={formatDateTime(store.created_at)} />
      <Fact label="Plan" value={planLabel(store.subscription_plan)} />
      <Fact label="Expires" value={store.subscription_expires_at ?? '—'} />
      <Fact
        label="Last paid plan"
        value={
          checkout?.paid_at
            ? `${planLabel(checkout.plan)} · ${formatDateTime(checkout.paid_at)} · ${formatMoney(
                checkout.amount,
                checkout.currency,
              )}`
            : 'No paid checkout'
        }
      />
      <Fact label="Products" value={String(store.product_count)} />
      <Fact label="Orders" value={String(store.order_count)} />
      <Fact
        label="COD"
        value={store.payments.cod_enabled ? 'Enabled' : 'Off'}
      />
      <Fact
        label="Razorpay"
        value={
          store.payments.razorpay_enabled
            ? `On · ${store.payments.razorpay_mode}${
                store.payments.razorpay_key_id_masked ? ` · ${store.payments.razorpay_key_id_masked}` : ''
              }`
            : store.payments.razorpay_configured
              ? 'Configured, disabled'
              : 'Off'
        }
      />
      <Fact
        label="UPI"
        value={
          store.payments.upi_enabled
            ? `On${store.payments.upi_vpa_masked ? ` · ${store.payments.upi_vpa_masked}` : ''}`
            : 'Off'
        }
      />
      {store.instagram_username ? (
        <Fact label="Instagram username" value={`@${store.instagram_username}`} />
      ) : null}
    </DetailSection>
  )
}

export default function PlatformAdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const userId = params.id
  const { isPlatformAdmin, isLoading: adminLoading } = usePlatformAdmin()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<PlatformAdminUserDetail | null>(null)

  useEffect(() => {
    if (!adminLoading && !isPlatformAdmin) {
      router.replace('/dashboard')
    }
  }, [adminLoading, isPlatformAdmin, router])

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchPlatformAdminUser(userId)
      setDetail(res.data)
    } catch (e) {
      if (getApiErrorCode(e) === 'FORBIDDEN') {
        router.replace('/dashboard')
        return
      }
      setError(getErrorMessage(e, 'Could not load this user'))
    } finally {
      setLoading(false)
    }
  }, [router, userId])

  useEffect(() => {
    if (!isPlatformAdmin) return
    void load()
  }, [isPlatformAdmin, load])

  const title = useMemo(() => detail?.user.email ?? 'User', [detail?.user.email])

  if (adminLoading || !isPlatformAdmin) {
    return (
      <main className="min-h-full bg-gray-100">
        <CatalogHeader title="User" backHref="/platform-admin/workspace/users" showSettings={false} />
      </main>
    )
  }

  return (
    <main className="min-h-full bg-gray-100 pb-10">
      <CatalogHeader title={title} backHref="/platform-admin/workspace/users" showSettings={false} />
      <div className="flex flex-col gap-4 px-5 pt-2">
        {loading ? (
          <div className="flex flex-col gap-3">
            <OrderRowSkeleton />
            <OrderRowSkeleton />
          </div>
        ) : error ? (
          <EmptyState title="Could not load user" description={error} />
        ) : !detail ? (
          <EmptyState title="User not found" />
        ) : (
          <>
            <DetailSection>
              <div className="px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Account</p>
              </div>
              <Fact label="Email" value={detail.user.email ?? '—'} />
              <Fact label="Phone" value={detail.user.phone ?? '—'} />
              <Fact label="Signed up" value={formatDateTime(detail.user.created_at)} />
              <Fact label="Last sign-in" value={formatDateTime(detail.user.last_sign_in_at)} />
              <Fact
                label="Auth providers"
                value={detail.user.providers.length > 0 ? detail.user.providers.join(', ') : '—'}
              />
            </DetailSection>

            {detail.stores.length === 0 ? (
              <EmptyState
                title="No store yet"
                description="This signed-in user has not created a store."
              />
            ) : (
              detail.stores.map((store) => (
                <StoreCard
                  key={store.id}
                  store={store}
                  checkout={latestPaidCheckout(store.id, detail.subscriptions)}
                />
              ))
            )}
          </>
        )}
      </div>
    </main>
  )
}
