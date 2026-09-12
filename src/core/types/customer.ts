export type Customer = {
  id: number
  store_id: number
  whatsapp_number: string
  name: string | null
  email: string | null
  total_orders: number
  total_spent: number
  last_seen_at: string | null
  created_at: string
  display_phone?: string | null
}

export type ListCustomersResponse = {
  success: boolean
  message: string
  data: {
    store_id: number
    customers: Customer[]
    count: number
  }
}

export type CreateCustomerPayload = {
  store_id: number
  name: string
  email?: string
  phone?: string
}

export type CreateCustomerResponse = {
  success: boolean
  message: string
  data: Customer
}
