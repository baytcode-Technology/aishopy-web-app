import type { Order } from '@/core/types/order'

export type SalesPeriod = 'today' | '7d' | '30d' | 'month'

export const SALES_PERIOD_OPTIONS: { id: SalesPeriod; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'month', label: 'This month' },
]

export type SalesSourceKey = 'storefront' | 'whatsapp' | 'offline' | 'other'

export type SalesOverview = {
  salesTotal: number
  orderCount: number
  avgOrder: number
  needsAttention: number
  bySource: Record<SalesSourceKey, number>
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function periodBounds(period: SalesPeriod, now = new Date()): { start: Date; end: Date } {
  const end = new Date(now)
  if (period === 'today') return { start: startOfLocalDay(now), end }
  if (period === '7d') {
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 6)
    return { start, end }
  }
  if (period === '30d') {
    const start = startOfLocalDay(now)
    start.setDate(start.getDate() - 29)
    return { start, end }
  }
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
    end,
  }
}

function normalizeSource(source: string): SalesSourceKey {
  const s = source.trim().toLowerCase()
  if (s === 'storefront' || s === 'whatsapp' || s === 'offline') return s
  return 'other'
}

function needsAttention(order: Order): boolean {
  const paymentOpen =
    order.payment_status === 'pending' || order.payment_status === 'confirming'
  return paymentOpen || order.fulfillment_status !== 'fulfilled'
}

export function computeSalesOverview(
  orders: Order[],
  period: SalesPeriod,
  now = new Date(),
): SalesOverview {
  const { start, end } = periodBounds(period, now)
  const startMs = start.getTime()
  const endMs = end.getTime()
  const bySource: Record<SalesSourceKey, number> = {
    storefront: 0,
    whatsapp: 0,
    offline: 0,
    other: 0,
  }

  let salesTotal = 0
  let orderCount = 0
  let attention = 0

  for (const order of orders) {
    if (order.order_status === 'cancelled') continue
    const created = new Date(order.created_at).getTime()
    if (Number.isNaN(created) || created < startMs || created > endMs) continue
    orderCount += 1
    salesTotal += Number(order.total) || 0
    bySource[normalizeSource(order.source)] += 1
    if (needsAttention(order)) attention += 1
  }

  return {
    salesTotal,
    orderCount,
    avgOrder: orderCount > 0 ? salesTotal / orderCount : 0,
    needsAttention: attention,
    bySource,
  }
}
