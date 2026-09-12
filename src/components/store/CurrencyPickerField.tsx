'use client'

import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Modal } from '@/components/ui/Modal'
import { CURRENCY_OPTIONS } from '@/core/data/currencies'
import { useMemo, useState } from 'react'

type Props = {
  value: string
  onChange: (code: string) => void
  label?: string
  error?: string
}

export function CurrencyPickerField({
  value,
  onChange,
  label = 'Currency *',
  error,
}: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CURRENCY_OPTIONS
    return CURRENCY_OPTIONS.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    )
  }, [query])

  const displayCode = value ? value.toUpperCase() : ''

  return (
    <div className="mb-1">
      <p className="mb-2 text-[13px] font-bold text-gray-600">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center justify-between rounded-xl border bg-surface px-4 py-3.5 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <span
          className={`flex-1 text-left text-[15px] ${
            displayCode ? 'font-semibold text-ink' : 'text-gray-400'
          }`}
        >
          {displayCode || 'Select currency'}
        </span>
        <MenuIcon name="chevron-down" className="h-3 w-3 text-gray-400" />
      </button>
      {error ? <p className="mt-1.5 pl-1 text-xs text-red-500">{error}</p> : null}

      <Modal
        open={open}
        title="Select currency"
        subtitle="Choose your store currency"
        onClose={() => {
          setOpen(false)
          setQuery('')
        }}
        zClass="z-50"
      >
        <div className="mb-3">
          <Input
            label="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search currency"
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-gray-400">No currencies found</p>
          ) : (
            filtered.map((item) => {
              const selected = value === item.code
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    onChange(item.code)
                    setOpen(false)
                    setQuery('')
                  }}
                  className={`flex w-full items-center justify-between border-b border-gray-100 px-1 py-3.5 text-left ${
                    selected ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-[15px] font-semibold text-ink">{item.code}</p>
                    <p className="mt-0.5 text-[13px] text-gray-500">
                      {item.name} · {item.symbol}
                    </p>
                  </div>
                  {selected ? (
                    <MenuIcon name="check" className="h-3.5 w-3.5 text-brand-primary" />
                  ) : null}
                </button>
              )
            })
          )}
        </div>
      </Modal>
    </div>
  )
}
