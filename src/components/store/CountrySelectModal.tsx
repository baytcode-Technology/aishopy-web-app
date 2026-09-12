'use client'

import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Modal } from '@/components/ui/Modal'
import { COUNTRY_DIAL_CODES } from '@/core/data/country-dial-codes'
import { COUNTRY_OPTIONS, type CountryValue } from '@/core/lib/country-currency'
import { useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (country: CountryValue) => void
  selectedCode?: string
  title: string
  subtitle: string
  showCallingCode?: boolean
}

export function CountrySelectModal({
  open,
  onClose,
  onSelect,
  selectedCode,
  title,
  subtitle,
  showCallingCode = false,
}: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return COUNTRY_OPTIONS
    return COUNTRY_OPTIONS.filter((item) => {
      const dial = COUNTRY_DIAL_CODES[item.cca2] ?? ''
      return (
        item.name.toLowerCase().includes(q) ||
        item.cca2.toLowerCase().includes(q) ||
        dial.includes(q.replace(/^\+/, ''))
      )
    })
  }, [query])

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onClose} zClass="z-50">
      <div className="mb-3">
        <Input
          label="Search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search country"
        />
      </div>
      <div className="max-h-[50vh] overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-gray-400">No countries found</p>
        ) : (
          filtered.map((item) => {
            const selected = selectedCode === item.cca2
            const dial = COUNTRY_DIAL_CODES[item.cca2]
            return (
              <button
                key={item.cca2}
                type="button"
                onClick={() => {
                  onSelect(item)
                  setQuery('')
                  onClose()
                }}
                className={`flex w-full items-center justify-between border-b border-gray-100 px-1 py-3.5 text-left ${
                  selected ? 'bg-gray-50' : ''
                }`}
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-[15px] font-semibold text-ink">{item.name}</p>
                  {showCallingCode && dial ? (
                    <p className="mt-0.5 text-[13px] text-gray-500">+{dial}</p>
                  ) : null}
                </div>
                {selected ? <MenuIcon name="check" className="h-3.5 w-3.5 text-brand-primary" /> : null}
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
