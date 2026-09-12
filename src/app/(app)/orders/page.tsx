'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Fab } from '@/components/catalog/Fab'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'
import { OrderActiveFilterChips } from '@/components/orders/OrderActiveFilterChips'
import { OrderCard } from '@/components/orders/OrderCard'
import { OrderFilterModal } from '@/components/orders/OrderFilterModal'
import { OrderSearchBar } from '@/components/orders/order-create/OrderSearchBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { OrdersSkeletonList } from '@/components/ui/Skeleton'
import { fetchOrders } from '@/core/api/orders'
import { getErrorMessage } from '@/core/lib/api-error'
import { filterOrdersList } from '@/core/lib/filter-orders'
import {
  EMPTY_ORDER_FILTERS,
  hasActiveOrderFilters,
  removeOrderFilterChip,
  type OrderFilters,
  type OrderStatusField,
} from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'
import { useOrdersUnread } from '@/providers/orders-unread-provider'
import { useStore } from '@/providers/store-provider'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function OrdersPage() {
  const { store } = useStore()
  const { syncOrdersUnread, onOrderViewed } = useOrdersUnread()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<OrderFilters>(EMPTY_ORDER_FILTERS)

  const loadOrders = useCallback(async () => {
    if (!store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchOrders(store.id)
      setOrders(res.data.orders)
      syncOrdersUnread(res.data.orders)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load orders'))
    } finally {
      setLoading(false)
    }
  }, [store?.id, syncOrdersUnread])

  useEffect(() => {
    void loadOrders()
  }, [loadOrders])

  useEffect(() => {
    return onOrderViewed((orderId) => {
      setOrders((prev) => {
        const next = prev.map((o) =>
          o.id === orderId
            ? { ...o, merchant_viewed_at: o.merchant_viewed_at ?? new Date().toISOString() }
            : o,
        )
        syncOrdersUnread(next)
        return next
      })
    })
  }, [onOrderViewed, syncOrdersUnread])

  const filteredOrders = useMemo(
    () => filterOrdersList(orders, searchQuery, filters),
    [orders, searchQuery, filters],
  )

  const filtersActive = hasActiveOrderFilters(filters)

  const clearAllFilters = () => setFilters(EMPTY_ORDER_FILTERS)

  const removeFilter = (field: OrderStatusField, value: string) => {
    setFilters((prev) => removeOrderFilterChip(prev, field, value))
  }

  return (
    <main className="min-h-full bg-gray-100 pb-28">
      <CatalogHeader title="Orders" subtitle="Manage customer orders & COD" />

      <div className="flex items-start gap-2.5 px-4 py-2">
        <div className="flex-1">
          <OrderSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by customer name or phone"
          />
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          aria-label="Filter orders"
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

      <OrderActiveFilterChips
        filters={filters}
        onRemove={removeFilter}
        onClearAll={clearAllFilters}
      />

      {error ? <p className="px-5 pb-2 text-[13px] font-medium text-[#E11D48]">{error}</p> : null}

      {loading ? (
        <div className="px-4">
          <OrdersSkeletonList />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex-1 px-5">
          <EmptyState
            icon="shopping-cart"
            title="No orders yet"
            description="Create your first order when a customer buys via chat or in person."
          />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="flex-1 px-5">
          <EmptyState
            icon="search"
            title="No matching orders"
            description="Try a different search or adjust your filters."
          />
        </div>
      ) : (
        <div className="mx-4 overflow-hidden rounded-2xl border border-gray-200 bg-surface pb-32">
          {filteredOrders.map((item, index) => (
            <OrderCard
              key={item.id}
              order={item}
              currency={store?.currency}
              isLast={index === filteredOrders.length - 1}
            />
          ))}
        </div>
      )}

      <Fab onClick={() => setModalOpen(true)} />

      <OrderFilterModal
        open={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onApply={setFilters}
      />

      {store?.id ? (
        <CreateOrderModal
          open={modalOpen}
          storeId={store.id}
          currency={store.currency}
          onClose={() => setModalOpen(false)}
          onCreated={() => void loadOrders()}
        />
      ) : null}
    </main>
  )
}
