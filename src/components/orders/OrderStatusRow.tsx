'use client'

import { OrderStatusBadge } from '@/components/orders/OrderStatusBadge'
import { statusFieldIcon, statusFieldTitle, type OrderStatusField } from '@/core/lib/order-status'

type Props = {
  field: OrderStatusField
  value: string
  onPress: () => void
  disabled?: boolean
}

function FieldIcon({ field }: { field: OrderStatusField }) {
  const name = statusFieldIcon(field)
  if (name === 'credit-card') {
    return (
      <svg className="h-[18px] w-[18px] text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4H4V6h16v2Z" />
      </svg>
    )
  }
  if (name === 'truck') {
    return (
      <svg className="h-[18px] w-[18px] text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M3 5h11v10H3V5Zm12 3h3l3 3v4h-6V8ZM6.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
      </svg>
    )
  }
  return (
    <svg className="h-[18px] w-[18px] text-gray-500" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15Z" />
    </svg>
  )
}

export function OrderStatusRow({ field, value, onPress, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className="mb-2 flex w-full items-center rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-3.5 disabled:opacity-60"
    >
      <span className="flex w-9 items-center justify-center">
        <FieldIcon field={field} />
      </span>
      <span className="ml-2 flex-1 text-left text-[15px] font-semibold text-ink">
        {statusFieldTitle(field)}
      </span>
      <OrderStatusBadge value={value} />
    </button>
  )
}
