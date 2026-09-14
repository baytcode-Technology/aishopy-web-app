'use client'

import { CountryPickerField } from '@/components/store/CountryPickerField'
import { CurrencyPickerField } from '@/components/store/CurrencyPickerField'
import { IndustryPicker } from '@/components/store/IndustryPicker'
import { PhoneNumberField } from '@/components/store/PhoneNumberField'
import { StoreLogoPicker, type PickedLogo } from '@/components/store/StoreLogoPicker'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { updateMyStore } from '@/core/api/stores'
import { getApiErrorCode, getErrorMessage } from '@/core/lib/api-error'
import {
  DEFAULT_COUNTRY,
  defaultCurrencyForCountry,
  guessCountryCodeFromName,
  type CountryValue,
} from '@/core/lib/country-currency'
import { buildStoreUpdatePatch } from '@/core/lib/store-patch'
import type { Store } from '@/core/types/store'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useRef, useState } from 'react'

type Props = {
  open: boolean
  store: Store | null
  onClose: () => void
  onUpdated: (store: Store) => void
}

export function EditStoreModal({ open, store, onClose, onUpdated }: Props) {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('')
  const [description, setDescription] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [country, setCountry] = useState<CountryValue>(DEFAULT_COUNTRY)
  const [currency, setCurrency] = useState('USD')
  const [currencyTouched, setCurrencyTouched] = useState(false)
  const [logoImage, setLogoImage] = useState<PickedLogo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const prevCountryCode = useRef(country.cca2)

  useEffect(() => {
    if (!open || !store) return
    setName(store.name)
    setIndustry(store.industry ?? '')
    setDescription(store.description ?? '')
    setPhoneNumber(store.whatsapp_number ?? '')
    setCountry({
      name: store.country ?? DEFAULT_COUNTRY.name,
      cca2: guessCountryCodeFromName(store.country ?? DEFAULT_COUNTRY.name),
    })
    setCurrency(store.currency)
    setCurrencyTouched(false)
    setLogoImage(null)
    setError(null)
    prevCountryCode.current = guessCountryCodeFromName(store.country ?? DEFAULT_COUNTRY.name)
  }, [open, store])

  const handleCountryChange = (next: CountryValue) => {
    setCountry(next)
    if (!currencyTouched || prevCountryCode.current === country.cca2) {
      setCurrency(defaultCurrencyForCountry(next.cca2))
    }
    prevCountryCode.current = next.cca2
  }

  const handleClose = () => {
    setLogoImage(null)
    setError(null)
    onClose()
  }

  const handleSave = async () => {
    if (!store) return

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Store name is required')
      return
    }
    const trimmedPhone = phoneNumber.trim()
    if (trimmedPhone && (trimmedPhone.length < 8 || trimmedPhone.length > 20)) {
      setError('Contact number must be 8–20 characters')
      return
    }
    if (!country.name.trim()) {
      setError('Country is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      let nextLogoUrl: string | null | undefined = undefined

      if (logoImage) {
        const [uploaded] = await uploadProductImages(store.id, [logoImage.file])
        nextLogoUrl = uploaded
      }

      const patch = buildStoreUpdatePatch(store, {
        name: trimmedName,
        industry,
        description,
        whatsapp_number: trimmedPhone || '',
        country: country.name.trim(),
        currency: currency.trim().toUpperCase(),
        ...(nextLogoUrl !== undefined ? { logo_url: nextLogoUrl } : {}),
      })

      if (Object.keys(patch).length === 0) {
        handleClose()
        return
      }

      const res = await updateMyStore(store.id, patch)
      onUpdated(res.data.store)
      handleClose()
    } catch (e) {
      const code = getApiErrorCode(e)
      if (code === 'SLUG_EXISTS' || code === 'CONFLICT') {
        setError('This store name is already taken. Change the store name.')
        return
      }
      if (code === 'WHATSAPP_EXISTS') {
        setError(
          'This contact number is already registered. Use a different number or leave it blank.',
        )
        return
      }
      setError(getErrorMessage(e, 'Could not update store'))
    } finally {
      setLoading(false)
    }
  }

  if (!store) return null

  return (
    <Modal
      open={open}
      title="Edit store"
      onClose={handleClose}
      footer={<Button label="Save changes" loading={loading} onClick={() => void handleSave()} />}
    >
      <div className="flex flex-col gap-4">
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
        <StoreLogoPicker
          image={logoImage}
          remoteUrl={store.logo_url}
          storeName={store.name}
          onChange={setLogoImage}
          label="Store logo"
        />
        <Input
          label="Store name *"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My Shop"
        />
        <CountryPickerField value={country} onChange={handleCountryChange} />
        <CurrencyPickerField
          value={currency}
          onChange={(code) => {
            setCurrencyTouched(true)
            setCurrency(code)
          }}
        />
        <PhoneNumberField
          value={phoneNumber}
          onChange={setPhoneNumber}
          resetKey={store ? `${store.id}-${open}` : undefined}
          label="Contact number"
        />
        <IndustryPicker value={industry} onChange={setIndustry} />
        <Input
          label="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Tell customers about your shop"
          multiline
        />
      </div>
    </Modal>
  )
}
