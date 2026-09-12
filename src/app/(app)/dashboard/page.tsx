'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { StoreAvatar } from '@/components/store/StoreAvatar'
import { fetchCategories } from '@/core/api/categories'
import { fetchAllChats } from '@/core/api/chats'
import { fetchOrders } from '@/core/api/orders'
import { fetchProducts } from '@/core/api/products'
import { formatMoney } from '@/core/lib/format-money'
import {
  computeSalesOverview,
  SALES_PERIOD_OPTIONS,
  type SalesPeriod,
  type SalesSourceKey,
} from '@/core/lib/sales-overview'
import type { Order } from '@/core/types/order'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Stats = {
  products: number
  categories: number
  orders: number
  chats: number
}

const SOURCE_LABELS: { key: SalesSourceKey; label: string }[] = [
  { key: 'storefront', label: 'Storefront' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'offline', label: 'Offline' },
  { key: 'other', label: 'Other' },
]

export default function DashboardPage() {
  const { store } = useStore()
  const [stats, setStats] = useState<Stats>({
    products: 0,
    categories: 0,
    orders: 0,
    chats: 0,
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('30d')
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    try {
      const [productsRes, categoriesRes, ordersRes, chatsRes] = await Promise.all([
        fetchProducts(store.id),
        fetchCategories(store.id),
        fetchOrders(store.id),
        fetchAllChats(store.id),
      ])
      const orderList = ordersRes.data.orders
      setOrders(orderList)
      setStats({
        products: productsRes.data.products.length,
        categories: categoriesRes.data.categories.length,
        orders: orderList.length,
        chats: chatsRes.whatsapp.length + chatsRes.instagram.length,
      })
    } catch {
      // Keep last known stats on refresh failure
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const sales = useMemo(() => computeSalesOverview(orders, salesPeriod), [orders, salesPeriod])

  const sourceRows = useMemo(
    () =>
      SOURCE_LABELS.filter((row) => sales.bySource[row.key] > 0).map((row) => ({
        ...row,
        count: sales.bySource[row.key],
      })),
    [sales.bySource],
  )

  const currency = store?.currency
  const subtitle = loading
    ? 'Loading overview…'
    : `${stats.products} products · ${stats.orders} orders · ${stats.chats} chats`

  return (
    <main className="min-h-full bg-gray-100 pb-28">
      <CatalogHeader title="Dashboard" subtitle={subtitle} />

      <div className="flex flex-col gap-4 px-5 pb-32">
        <div className="rounded-[28px] border border-gray-200 bg-surface p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-4">
            <StoreAvatar store={store} size="sm" />
            <div className="flex-1">
              <h2 className="text-2xl font-semibold tracking-tight text-ink">
                {store?.name ?? 'Your store'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatCard label="Products" value={stats.products} href="/products" icon="grid" />
            <StatCard
              label="Categories"
              value={stats.categories}
              href="/products/categories"
              icon="folder"
            />
            <StatCard label="Orders" value={stats.orders} href="/orders" icon="bag" />
            <StatCard label="Chats" value={stats.chats} href="/inbox" icon="chat" />
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-[28px] border border-gray-200 bg-surface p-5 shadow-sm">
          <Link href="/orders" className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold uppercase tracking-widest text-gray-500">Sales</span>
            <span className="text-[12px] text-gray-400">›</span>
          </Link>

          <div className="flex flex-wrap gap-2">
            {SALES_PERIOD_OPTIONS.map((opt) => {
              const active = salesPeriod === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSalesPeriod(opt.id)}
                  className={`rounded-xl border px-3 py-1.5 ${
                    active
                      ? 'border-brand-primary/30 bg-brand-primary/10'
                      : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      active ? 'text-brand-primary' : 'text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              )
            })}
          </div>

          <div>
            <p className="text-3xl font-extrabold tracking-tight text-ink">
              {formatMoney(sales.salesTotal, currency)}
            </p>
            <p className="mt-1 text-xs text-gray-500">Booked sales (excl. cancelled)</p>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-lg font-bold text-ink">{sales.orderCount}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-gray-400">Orders</p>
            </div>
            <div>
              <p className="text-lg font-bold text-ink">{formatMoney(sales.avgOrder, currency)}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-gray-400">Avg order</p>
            </div>
          </div>

          {sales.needsAttention > 0 ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold text-amber-900">
                {sales.needsAttention} need{sales.needsAttention === 1 ? 's' : ''} attention
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800/80">Unpaid or not fulfilled yet</p>
            </div>
          ) : null}

          {sourceRows.length > 0 ? (
            <div className="gap-2 pt-1">
              <p className="text-[11px] uppercase tracking-widest text-gray-400">
                Where orders came from
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sourceRows.map((row) => (
                  <div key={row.key} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-1.5">
                    <p className="text-xs text-gray-700">
                      {row.label} <span className="font-bold text-ink">{row.count}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500">No orders in this period.</p>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({
  label,
  value,
  href,
  icon,
}: {
  label: string
  value: number
  href: string
  icon: 'grid' | 'folder' | 'bag' | 'chat'
}) {
  return (
    <Link
      href={href}
      className="min-w-[44%] flex-1 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3.5"
    >
      <StatIcon name={icon} />
      <p className="mt-2 text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-gray-400">{label}</p>
    </Link>
  )
}

function StatIcon({ name }: { name: 'grid' | 'folder' | 'bag' | 'chat' }) {
  if (name === 'folder') {
    return (
      <svg className="h-3.5 w-3.5 text-brand-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2Z" />
      </svg>
    )
  }
  if (name === 'bag') {
    return (
      <svg className="h-3.5 w-3.5 text-brand-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M9 7V6a3 3 0 0 1 6 0v1h4a1 1 0 0 1 1 1v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a1 1 0 0 1 1-1h4Zm2-1a1 1 0 1 1 2 0v1h-2V6Z" />
      </svg>
    )
  }
  if (name === 'chat') {
    return (
      <svg className="h-3.5 w-3.5 text-brand-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2Z" />
      </svg>
    )
  }
  return (
    <svg className="h-3.5 w-3.5 text-brand-primary" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z" />
    </svg>
  )
}
