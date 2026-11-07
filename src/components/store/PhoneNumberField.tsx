'use client'

import { CountrySelectModal } from '@/components/store/CountrySelectModal'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { COUNTRY_DIAL_CODES } from '@/core/data/country-dial-codes'
import type { CountryValue } from '@/core/lib/country-currency'
import { formatE164, parseE164Phone } from '@/core/lib/parse-phone'
import { useEffect, useRef, useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  resetKey?: string
  /** Store country. Fills the phone code until the owner picks a different one. */
  countryCode?: string
}

export function PhoneNumberField({
  value,
  onChange,
  label = 'Contact number',
  error,
  resetKey,
  countryCode,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState('IN')
  const [callingCode, setCallingCode] = useState('91')
  const [nationalNumber, setNationalNumber] = useState('')
  const phoneCodeTouched = useRef(false)
  const appliedCountry = useRef<string | null>(null)
  const nationalRef = useRef('')
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    phoneCodeTouched.current = false
    appliedCountry.current = null
  }, [resetKey])

  useEffect(() => {
    if (!value.trim()) {
      nationalRef.current = ''
      setNationalNumber('')
      return
    }
    const parsed = parseE164Phone(value)
    nationalRef.current = parsed.national
    setSelectedCode(parsed.countryCode)
    setCallingCode(parsed.callingCode)
    setNationalNumber(parsed.national)
  }, [value, resetKey])

  useEffect(() => {
    if (!countryCode || phoneCodeTouched.current) return
    const previous = appliedCountry.current
    if (previous === countryCode) return
    appliedCountry.current = countryCode
    if (previous === null && value.trim()) return

    const nextCalling = COUNTRY_DIAL_CODES[countryCode]
    if (!nextCalling) return
    setSelectedCode(countryCode)
    setCallingCode(nextCalling)
    if (nationalRef.current) {
      onChangeRef.current(formatE164(nextCalling, nationalRef.current))
    }
  }, [countryCode, value])

  const updateNational = (text: string) => {
    const digits = text.replace(/\D/g, '')
    nationalRef.current = digits
    setNationalNumber(digits)
    onChange(formatE164(callingCode, digits))
  }

  const handleCountrySelect = (country: CountryValue) => {
    phoneCodeTouched.current = true
    const nextCalling = COUNTRY_DIAL_CODES[country.cca2] ?? callingCode
    setSelectedCode(country.cca2)
    setCallingCode(nextCalling)
    onChange(formatE164(nextCalling, nationalNumber))
  }

  return (
    <div className="mb-1">
      <p className="mb-2 text-[13px] font-bold text-gray-600">{label}</p>
      <div
        className={`flex items-center rounded-xl border bg-surface px-3 py-2.5 ${
          error ? 'border-red-400' : 'border-gray-200'
        }`}
      >
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mr-3 flex items-center border-r border-gray-200 pr-3"
        >
          <MenuIcon name="chevron-down" className="h-2.5 w-2.5 text-gray-400" />
        </button>
        <span className="mr-3 text-[15px] font-semibold text-ink">+{callingCode}</span>
        <input
          value={nationalNumber}
          onChange={(event) => updateNational(event.target.value)}
          placeholder="Mobile number"
          inputMode="tel"
          className="min-w-0 flex-1 bg-transparent py-1 text-[15px] text-ink outline-none"
        />
      </div>
      {error ? <p className="mt-1.5 pl-1 text-xs text-red-500">{error}</p> : null}

      <CountrySelectModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleCountrySelect}
        selectedCode={selectedCode}
        title="Select country code"
        subtitle="Choose country for phone number"
        showCallingCode
      />
    </div>
  )
}
