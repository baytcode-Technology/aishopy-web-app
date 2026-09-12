'use client'

import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { formatOrderListDate, orderListTitle } from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'
import { useOrdersUnread } from '@/providers/orders-unread-provider'
import Link from 'next/link'

type Props = {
  order: Order
  currency?: string
  isLast?: boolean
}

export function OrderCard({ order, currency = 'INR', isLast }: Props) {
  const { isOrderUnviewed } = useOrdersUnread()
  const symbol = currency === 'INR' ? '₹' : '$'
  const title = orderListTitle(order)
  const isUnviewed = isOrderUnviewed(order)
  const itemQuantity =
    order.item_quantity ??
    (order.items?.length ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0)

  return (
    <Link href={`/orders/${order.id}`} className="block active:opacity-90">
      <div className={`px-4 py-4 ${isLast ? '' : 'border-b border-gray-200'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{title}</p>
            {isUnviewed && itemQuantity > 0 ? <UnreadCountBadge count={itemQuantity} /> : null}
          </div>
          <p className="shrink-0 text-[15px] font-bold text-ink">
            {symbol}
            {order.total}
          </p>
        </div>

        <p className="mt-1 text-[13px] text-gray-400">{formatOrderListDate(order.created_at)}</p>

        <div className="mt-2.5 flex flex-wrap gap-2">
          <OrderStatusBadge value={order.order_status} />
          <OrderStatusBadge value={order.payment_status} />
          <OrderStatusBadge value={order.fulfillment_status} />
        </div>
      </div>
    </Link>
  )
}
