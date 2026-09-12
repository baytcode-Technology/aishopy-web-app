'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  EMPTY_ORDER_FILTERS,
  formatOrderStatusLabel,
  hasActiveOrderFilters,
  ORDER_FULFILLMENT_OPTIONS,
  ORDER_LIFECYCLE_OPTIONS,
  ORDER_PAYMENT_OPTIONS,
  statusFieldTitle,
  type OrderFilters,
  type OrderStatusField,
} from '@/core/lib/order-status'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  filters: OrderFilters
  onClose: () => void
  onApply: (filters: OrderFilters) => void
}

const FILTER_SECTIONS: OrderStatusField[] = [
  'order_status',
  'payment_status',
  'fulfillment_status',
]

function optionsForField(field: OrderStatusField) {
  switch (field) {
    case 'order_status':
      return ORDER_LIFECYCLE_OPTIONS
    case 'payment_status':
      return ORDER_PAYMENT_OPTIONS
    case 'fulfillment_status':
      return ORDER_FULFILLMENT_OPTIONS
  }
}

export function OrderFilterModal({ open, filters, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<OrderFilters>(filters)
  const [expanded, setExpanded] = useState<OrderStatusField | null>('order_status')

  useEffect(() => {
    if (!open) return
    setDraft(filters)
    setExpanded('order_status')
  }, [open, filters])

  const toggleOption = (field: OrderStatusField, value: string) => {
    setDraft((prev) => {
      const current = prev[field] as string[]
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
      return { ...prev, [field]: next }
    })
  }

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const handleClear = () => {
    setDraft(EMPTY_ORDER_FILTERS)
    onApply(EMPTY_ORDER_FILTERS)
    onClose()
  }

  return (
    <Modal open={open} title="Filter orders" onClose={onClose}>
      {FILTER_SECTIONS.map((field) => {
        const isOpen = expanded === field
        const options = optionsForField(field)
        const selected = draft[field] as string[]

        return (
          <div key={field} className="border-b border-gray-100">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : field)}
              className="flex w-full items-center justify-between py-4"
            >
              <span className="text-[16px] font-semibold text-ink">{statusFieldTitle(field)}</span>
              <span className="text-[14px] text-gray-400">{isOpen ? '▴' : '▾'}</span>
            </button>

            {isOpen ? (
              <div className="flex flex-col gap-2.5 pb-4">
                {options.map((option) => {
                  const active = selected.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleOption(field, option)}
                      className={`rounded-xl border px-4 py-3.5 text-left ${
                        active ? 'border-ink bg-gray-50' : 'border-gray-200 bg-surface'
                      }`}
                    >
                      <span
                        className={`text-[15px] ${
                          active ? 'font-semibold text-ink' : 'font-medium text-gray-500'
                        }`}
                      >
                        {formatOrderStatusLabel(option)}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}

      <div className="mt-4 flex flex-col gap-2">
        {hasActiveOrderFilters(draft) ? (
          <button
            type="button"
            onClick={handleClear}
            className="py-2 text-center text-[14px] font-semibold text-gray-500"
          >
            Clear filters
          </button>
        ) : null}
        <Button label="Apply filters" onClick={handleApply} />
      </div>
    </Modal>
  )
}
