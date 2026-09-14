export type OrderLifecycleStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export type OrderPaymentStatus = 'pending' | 'confirming' | 'paid' | 'refunded'

export type OrderFulfillmentStatus = 'unfulfilled' | 'ready' | 'fulfilled'

export type OrderItem = {
  id: number
  order_id: number
  product_id: number
  variant_id: number | null
  quantity: number
  unit_price: number
  total_price: number
  snapshot: Record<string, unknown>
}

export type Order = {
  id: number
  store_id: number
  customer_id: number | null
  conversation_id: number | null
  order_number: string
  order_status: OrderLifecycleStatus
  payment_status: OrderPaymentStatus
  fulfillment_status: OrderFulfillmentStatus
  source: string
  subtotal: number
  discount_amount: number
  shipping_fee: number
  tax_amount: number
  total: number
  shipping_address?: CreateOrderShippingAddress | Record<string, unknown> | null
  notes: string | null
  merchant_viewed_at?: string | null
  item_quantity?: number
  created_at: string
  updated_at: string
  customers: { name: string | null; whatsapp_number: string } | null
  items: OrderItem[]
  payment?: {
    id: number
    provider: string
    status: string
    amount: number
    currency: string
    payment_proof_url?: string | null
    provider_payment_id?: string | null
  } | null
}

export type ListOrdersResponse = {
  data: {
    store_id: number
    orders: Order[]
    count: number
  }
}

export type GetOrderResponse = {
  success: boolean
  message: string
  data: Order
}

export type UpdateOrderPayload = {
  store_id: number
  order_status?: OrderLifecycleStatus
  payment_status?: OrderPaymentStatus
  fulfillment_status?: OrderFulfillmentStatus
}

export type UpdateOrderResponse = {
  success: boolean
  message: string
  data: {
    order: Order
  }
}

export type CreateOrderLineItem = {
  product_id: number
  quantity: number
  variant_id?: number
}

export type CreateOrderShippingAddress = {
  name?: string
  phone_number?: string
  whatsapp_number?: string
  postcode?: string
  city?: string
  district?: string
  state?: string
  region?: string
}

export type CreateOrderPayload = {
  store_id: number
  items: CreateOrderLineItem[]
  customer_id?: number
  whatsapp_number?: string
  name?: string
  payment_method?: 'cod' | 'razorpay' | 'upi'
  shipping_address?: CreateOrderShippingAddress
  notes?: string
  offline?: boolean
}

export type CreateOrderResponse = {
  success: boolean
  message: string
  data: {
    order: Order
    items: OrderItem[]
  }
}
