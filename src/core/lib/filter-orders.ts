import type { OrderFilters } from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'

export function filterOrdersList(orders: Order[], query: string, filters: OrderFilters): Order[] {
  const q = query.trim().toLowerCase()

  return orders.filter((order) => {
    if (q) {
      const name = order.customers?.name?.toLowerCase() ?? ''
      const phone = order.customers?.whatsapp_number?.toLowerCase() ?? ''
      const orderNo = order.order_number.toLowerCase()
      if (!name.includes(q) && !phone.includes(q) && !orderNo.includes(q)) return false
    }

    if (filters.order_status.length > 0 && !filters.order_status.includes(order.order_status)) {
      return false
    }
    if (
      filters.payment_status.length > 0 &&
      !filters.payment_status.includes(order.payment_status)
    ) {
      return false
    }
    if (
      filters.fulfillment_status.length > 0 &&
      !filters.fulfillment_status.includes(order.fulfillment_status)
    ) {
      return false
    }

    return true
  })
}
