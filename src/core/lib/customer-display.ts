import type { Customer } from '@/core/types/customer'

export function customerDisplayPhone(customer: Customer): string | null {
  if (customer.display_phone) return customer.display_phone
  const n = customer.whatsapp_number
  if (!n || n.startsWith('offline-')) return null
  return n
}

export function customerDisplayName(customer: Customer): string {
  return customer.name?.trim() || 'Unnamed customer'
}
