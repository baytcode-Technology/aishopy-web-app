'use client'

import { fetchOrders, markOrderViewed as markOrderViewedApi } from '@/core/api/orders'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Order } from '@/core/types/order'
import { useStore } from '@/providers/store-provider'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

type OrdersUnreadContextValue = {
  ordersUnreadCount: number
  syncOrdersUnread: (orders: Order[]) => void
  refreshOrdersUnread: () => Promise<void>
  isOrderUnviewed: (order: Order) => boolean
  onOrderViewed: (handler: (orderId: number) => void) => () => void
  markOrderViewed: (orderId: number) => Promise<void>
}

const OrdersUnreadContext = createContext<OrdersUnreadContextValue | null>(null)

function countUnviewedOrders(orders: Order[], viewedOrderIds: Set<number>): number {
  return orders.filter((order) => !order.merchant_viewed_at && !viewedOrderIds.has(order.id)).length
}

export function OrdersUnreadProvider({ children }: { children: ReactNode }) {
  const { store } = useStore()
  const [ordersUnreadCount, setOrdersUnreadCount] = useState(0)
  const [viewedOrderIds, setViewedOrderIds] = useState<Set<number>>(() => new Set())
  const orderViewedListeners = useRef(new Set<(orderId: number) => void>())
  const markingOrderIds = useRef(new Set<number>())

  const isOrderUnviewed = useCallback(
    (order: Order) => !order.merchant_viewed_at && !viewedOrderIds.has(order.id),
    [viewedOrderIds],
  )

  const syncOrdersUnread = useCallback(
    (orders: Order[]) => {
      setOrdersUnreadCount(countUnviewedOrders(orders, viewedOrderIds))
    },
    [viewedOrderIds],
  )

  const refreshOrdersUnread = useCallback(async () => {
    if (!store?.id) return
    try {
      const res = await fetchOrders(store.id)
      setOrdersUnreadCount(countUnviewedOrders(res.data.orders, viewedOrderIds))
    } catch {
      // List screens surface fetch errors; keep last known count here.
    }
  }, [store?.id, viewedOrderIds])

  const onOrderViewed = useCallback((handler: (orderId: number) => void) => {
    orderViewedListeners.current.add(handler)
    return () => {
      orderViewedListeners.current.delete(handler)
    }
  }, [])

  const markOrderViewed = useCallback(
    async (orderId: number) => {
      if (!store?.id) return
      if (viewedOrderIds.has(orderId) || markingOrderIds.current.has(orderId)) return

      markingOrderIds.current.add(orderId)
      setViewedOrderIds((prev) => new Set(prev).add(orderId))
      setOrdersUnreadCount((count) => Math.max(0, count - 1))

      try {
        await markOrderViewedApi(store.id, orderId)
        orderViewedListeners.current.forEach((handler) => handler(orderId))
        const res = await fetchOrders(store.id)
        setOrdersUnreadCount(countUnviewedOrders(res.data.orders, new Set([...viewedOrderIds, orderId])))
      } catch (e) {
        setViewedOrderIds((prev) => {
          const next = new Set(prev)
          next.delete(orderId)
          return next
        })
        setOrdersUnreadCount((count) => count + 1)
        throw new Error(getErrorMessage(e, 'Could not mark order as read'))
      } finally {
        markingOrderIds.current.delete(orderId)
      }
    },
    [store?.id, viewedOrderIds],
  )

  useEffect(() => {
    if (!store?.id) {
      setOrdersUnreadCount(0)
      return
    }
    void refreshOrdersUnread()
  }, [store?.id, refreshOrdersUnread])

  const value = useMemo(
    () => ({
      ordersUnreadCount,
      syncOrdersUnread,
      refreshOrdersUnread,
      isOrderUnviewed,
      onOrderViewed,
      markOrderViewed,
    }),
    [
      ordersUnreadCount,
      syncOrdersUnread,
      refreshOrdersUnread,
      isOrderUnviewed,
      onOrderViewed,
      markOrderViewed,
    ],
  )

  return <OrdersUnreadContext.Provider value={value}>{children}</OrdersUnreadContext.Provider>
}

export function useOrdersUnread() {
  const ctx = useContext(OrdersUnreadContext)
  if (!ctx) {
    throw new Error('useOrdersUnread must be used within OrdersUnreadProvider')
  }
  return ctx
}
