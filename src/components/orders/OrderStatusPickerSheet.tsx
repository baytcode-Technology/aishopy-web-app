'use client'

import {
  changeStatusSheetTitle,
  formatOrderStatusLabel,
  getOrderStatusBadgeColors,
  statusOptionsForField,
  type OrderStatusField,
} from '@/core/lib/order-status'

type Props = {
  open: boolean
  field: OrderStatusField | null
  currentValue: string | null
  onClose: () => void
  onSelect: (value: string) => void
}

export function OrderStatusPickerSheet({ open, field, currentValue, onClose, onSelect }: Props) {
  const isOpen = open && field != null
  const options = field ? statusOptionsForField(field) : []
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative z-10 mx-5 mb-8 w-full max-w-lg rounded-2xl bg-surface px-5 py-4 shadow-lg">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[17px] font-bold text-gray-400">
            {field ? changeStatusSheetTitle(field) : ''}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="text-[18px] text-gray-500">
            ×
          </button>
        </div>

        {options.map((option) => {
          const active = option === currentValue
          const colors = getOrderStatusBadgeColors(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className="flex w-full items-center justify-between gap-3 py-2.5"
            >
              <span
                className="rounded-full border px-3 py-1.5 text-[14px] font-semibold"
                style={{
                  backgroundColor: colors.background,
                  borderColor: active ? colors.text : colors.border,
                  borderWidth: active ? 2 : 1,
                  color: colors.text,
                }}
              >
                {formatOrderStatusLabel(option)}
              </span>
              {active ? (
                <span className="text-[16px]" style={{ color: colors.text }}>
                  ✓
                </span>
              ) : (
                <span className="w-4" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
