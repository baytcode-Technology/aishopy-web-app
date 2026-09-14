import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  GetOrderResponse,
  ListOrdersResponse,
  UpdateOrderPayload,
  UpdateOrderResponse,
} from '@/core/types/order'

export async function fetchOrders(storeId: number): Promise<ListOrdersResponse> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch<ListOrdersResponse>(`${endpoints.orders}?${qs.toString()}`)
}

export async function fetchOrder(storeId: number, orderId: number): Promise<GetOrderResponse> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch<GetOrderResponse>(`${endpoints.orders}/${orderId}?${qs.toString()}`)
}

export async function updateOrder(
  orderId: number,
  payload: UpdateOrderPayload,
): Promise<UpdateOrderResponse> {
  return authenticatedFetch<UpdateOrderResponse>(`${endpoints.orders}/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return authenticatedFetch<CreateOrderResponse>(endpoints.orders, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function markOrderViewed(
  storeId: number,
  orderId: number,
): Promise<{ success: boolean; message: string }> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch(`${endpoints.orders}/${orderId}/viewed?${qs.toString()}`, {
    method: 'PATCH',
  })
}
