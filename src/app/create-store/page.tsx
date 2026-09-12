'use client'

import { AuthButton } from '@/components/auth/AuthButton'
import { AuthInput } from '@/components/auth/AuthInput'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { Button } from '@/components/ui/Button'
import { fetchIndustries } from '@/core/api/industries'
import { createStore } from '@/core/api/stores'
import { fetchSupportAdminStatus } from '@/core/api/support'
import { env } from '@/core/config/env'
import { CURRENCY_OPTIONS } from '@/core/data/currencies'
import { getApiErrorCode, getErrorMessage } from '@/core/lib/api-error'
import {
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY,
  defaultCurrencyForCountry,
  type CountryValue,
} from '@/core/lib/country-currency'
import type { IndustryGroup } from '@/core/types/industry'
import {
  createStoreFormSchema,
  slugifyFromName,
  toCreateStorePayload,
  type CreateStoreFormValues,
} from '@/core/validations/store.validation'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

type FieldErrors = Partial<Record<keyof CreateStoreFormValues, string>>

const STORE_NAME_TAKEN_HELPER = 'Already exists. Change the store name.'
const CONTACT_TAKEN_HELPER =
  'Already registered. Use a different number or leave it blank.'

function CreateStoreForm() {
  const { signOut } = useAuth()
  const { activateStoreSession, clearStore, refreshStores } = useStore()
  const router = useRouter()
  const [name, setName] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [country, setCountry] = useState<CountryValue>(DEFAULT_COUNTRY)
  const [currency, setCurrency] = useState('USD')
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [industry, setIndustry] = useState('')
  const [industries, setIndustries] = useState<IndustryGroup[]>([])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const prevCountryCode = useRef(country.cca2)
  const slug = slugifyFromName(name)

  useEffect(() => {
    void fetchSupportAdminStatus()
      .then((res) => setIsPlatformAdmin(res.data.isAdmin))
      .catch(() => setIsPlatformAdmin(false))
    void fetchIndustries()
      .then((res) => setIndustries(res.data.industries))
      .catch(() => setIndustries([]))
  }, [])

  const clearFieldError = (key: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleCountryChange = (cca2: string) => {
    const next = COUNTRY_OPTIONS.find((item) => item.cca2 === cca2) ?? DEFAULT_COUNTRY
    setCountry(next)
    if (!currencyTouched || prevCountryCode.current === country.cca2) {
      setCurrency(defaultCurrencyForCountry(next.cca2))
    }
    prevCountryCode.current = next.cca2
    clearFieldError('country')
  }

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const parsed = createStoreFormSchema.safeParse({
      name,
      slug,
      whatsapp_number: whatsappNumber,
      currency,
      country: country.name,
      description: description || null,
      industry: industry || null,
    })

    if (!parsed.success) {
      const next: FieldErrors = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CreateStoreFormValues
        const field = key === 'slug' ? 'name' : key
        if (!next[field]) next[field] = issue.message
      }
      setErrors(next)
      setFormError(parsed.error.issues[0]?.message ?? 'Please fix the form')
      return
    }

    setErrors({})
    setFormError('')
    setLoading(true)

    try {
      const res = await createStore(toCreateStorePayload(parsed.data))
      await refreshStores()
      await activateStoreSession(res.data.store, res.data.subdomainUrl, 'owner')
      router.replace('/products')
    } catch (e) {
      const code = getApiErrorCode(e)
      if (code === 'SLUG_EXISTS' || code === 'CONFLICT') {
        setErrors({ name: STORE_NAME_TAKEN_HELPER })
        setFormError('This store name is already taken. Change the store name.')
        return
      }
      if (code === 'WHATSAPP_EXISTS') {
        setErrors({ whatsapp_number: CONTACT_TAKEN_HELPER })
        setFormError(CONTACT_TAKEN_HELPER)
        return
      }
      setFormError(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  const selectClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-ink outline-none focus:border-ink focus:bg-surface'

  return (
    <AuthLayout
      title="Create your store"
      subtitle="Required fields are marked with *. Optional fields can be added now or later."
      footer={
        <div className="flex w-full flex-col items-center gap-3">
          <Button label="Sign out" variant="ghost" onClick={() => void handleSignOut()} />
          <Link href="/ai-privacy" className="text-[14px] font-semibold text-ink">
            AI & data privacy
          </Link>
        </div>
      }
    >
      {isPlatformAdmin ? (
        <Link href="/products" className="text-[14px] text-brand-green">
          Skip — open Admin home
        </Link>
      ) : null}

      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <p className="text-[13px] font-bold text-ink">Basics</p>
        <AuthInput
          label="Store name *"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            clearFieldError('name')
          }}
          placeholder="My Shop"
          error={errors.name}
        />
        <p className="-mt-3 pl-1 text-[13px] text-gray-500">
          Your store domain: {slug || 'my-shop'}.{env.storefrontBaseDomain}
        </p>

        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Country *</span>
          <select
            className={selectClass}
            value={country.cca2}
            onChange={(e) => handleCountryChange(e.target.value)}
          >
            {COUNTRY_OPTIONS.map((item) => (
              <option key={item.cca2} value={item.cca2}>
                {item.name}
              </option>
            ))}
          </select>
          {errors.country ? (
            <span className="text-[12px] font-medium text-[#E11D48]">{errors.country}</span>
          ) : null}
        </label>

        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Currency *</span>
          <select
            className={selectClass}
            value={currency}
            onChange={(e) => {
              setCurrencyTouched(true)
              setCurrency(e.target.value)
              clearFieldError('currency')
            }}
          >
            {CURRENCY_OPTIONS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.code} — {item.name} ({item.symbol})
              </option>
            ))}
          </select>
        </label>

        <AuthInput
          label="Contact number"
          value={whatsappNumber}
          onChange={(e) => {
            setWhatsappNumber(e.target.value)
            clearFieldError('whatsapp_number')
          }}
          placeholder="+91 98765 43210"
          type="tel"
          error={errors.whatsapp_number}
        />

        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Industry</span>
          <select
            className={selectClass}
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="">Select an industry (optional)</option>
            {industries.map((group) => (
              <optgroup key={group.id} label={group.name}>
                {group.children.map((child) => (
                  <option key={child.id} value={child.name}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        <AuthInput
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell customers about your shop"
          multiline
        />

        {formError ? <p className="text-sm text-[#E11D48]">{formError}</p> : null}
        <AuthButton label="Create store" loading={loading} type="submit" />
      </form>
    </AuthLayout>
  )
}

export default function CreateStorePage() {
  return (
    <RequireAuth>
      <CreateStoreForm />
    </RequireAuth>
  )
}
