'use client'

import {
  getOrderFilterChips,
  type OrderFilters,
  type OrderStatusField,
} from '@/core/lib/order-status'

type Props = {
  filters: OrderFilters
  onRemove: (field: OrderStatusField, value: string) => void
  onClearAll: () => void
}

export function OrderActiveFilterChips({ filters, onRemove, onClearAll }: Props) {
  const chips = getOrderFilterChips(filters)
  if (chips.length === 0) return null

  return (
    <div className="gap-2 px-4 pb-2">
      <div className="flex flex-wrap items-center gap-2 pr-1">
        {chips.map((chip) => (
          <div
            key={`${chip.field}:${chip.value}`}
            className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-100 py-1.5 pl-3 pr-1.5"
          >
            <span className="max-w-[220px] truncate text-[12px] font-semibold text-ink">
              {chip.label}
            </span>
            <button
              type="button"
              onClick={() => onRemove(chip.field, chip.value)}
              aria-label={`Remove ${chip.label}`}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-full border border-gray-200 bg-surface px-3 py-1.5 text-[12px] font-semibold text-gray-500"
        >
          Clear all
        </button>
      </div>
    </div>
  )
}
