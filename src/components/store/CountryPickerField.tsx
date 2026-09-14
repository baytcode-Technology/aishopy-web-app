'use client'

import { CountrySelectModal } from '@/components/store/CountrySelectModal'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { DEFAULT_COUNTRY, type CountryValue } from '@/core/lib/country-currency'
import { useState } from 'react'

type Props = {
  value: CountryValue
  onChange: (country: CountryValue) => void
  label?: string
  error?: string
}

export function CountryPickerField({
  value,
  onChange,
  label = 'Country *',
  error,
}: Props) {
  const [open, setOpen] = useState(false)
  const display = value.name || DEFAULT_COUNTRY.name

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
        <span className="flex-1 truncate text-left text-[15px] font-medium text-ink">{display}</span>
        <MenuIcon name="chevron-down" className="h-3 w-3 text-gray-400" />
      </button>
      {error ? <p className="mt-1.5 pl-1 text-xs text-red-500">{error}</p> : null}

      <CountrySelectModal
        open={open}
        onClose={() => setOpen(false)}
        onSelect={onChange}
        selectedCode={value.cca2}
        title="Select country"
        subtitle="Search and choose a country"
      />
    </div>
  )
}
