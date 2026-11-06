'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { updateMyStore } from '@/core/api/stores'
import { getErrorMessage } from '@/core/lib/api-error'
import { EMPTY_SHOP_POLICIES, parseShopPolicies } from '@/core/types/shop-policies'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function numField(value: number | null): string {
  return value == null ? '' : String(value)
}

function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-surface px-4 py-3">
      <p className="pr-3 text-[13px] font-bold tracking-wide text-gray-600">{label}</p>
      <Switch value={value} onValueChange={onValueChange} aria-label={label} onTrack="primary" />
    </div>
  )
}

export default function ShopPoliciesPage() {
  const router = useRouter()
  const { store, refreshStore } = useStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [hasPhysicalStore, setHasPhysicalStore] = useState(false)
  const [address, setAddress] = useState('')
  const [hours, setHours] = useState('')
  const [defaultDays, setDefaultDays] = useState('')
  const [deliveryFee, setDeliveryFee] = useState('')
  const [freeAbove, setFreeAbove] = useState('')
  const [sameDay, setSameDay] = useState(false)
  const [nextDay, setNextDay] = useState(false)
  const [serviceArea, setServiceArea] = useState('')
  const [returnDays, setReturnDays] = useState('')
  const [returnsAllowed, setReturnsAllowed] = useState<boolean | null>(null)
  const [exchangeAllowed, setExchangeAllowed] = useState(false)
  const [refundDays, setRefundDays] = useState('')
  const [returnNote, setReturnNote] = useState('')
  const [offerNote, setOfferNote] = useState('')
  const [pickupNote, setPickupNote] = useState('')

  useEffect(() => {
    if (!store) return
    const p = parseShopPolicies(store.shop_policies ?? EMPTY_SHOP_POLICIES)
    setHasPhysicalStore(p.has_physical_store)
    setAddress(p.address ?? '')
    setHours(p.hours ?? '')
    setDefaultDays(numField(p.default_delivery_business_days))
    setDeliveryFee(numField(p.delivery_fee))
    setFreeAbove(numField(p.free_delivery_above))
    setSameDay(p.same_day_delivery)
    setNextDay(p.next_day_delivery)
    setServiceArea(p.service_area ?? '')
    setReturnDays(numField(p.return_days))
    setReturnsAllowed(p.returns_allowed)
    setExchangeAllowed(p.exchange_allowed)
    setRefundDays(numField(p.refund_days_after_cancel))
    setReturnNote(p.return_note ?? '')
    setOfferNote(p.current_offer_note ?? '')
    setPickupNote(p.pickup_note ?? '')
  }, [store])

  const save = async () => {
    if (!store?.id) return
    setSaving(true)
    setError(null)
    try {
      await updateMyStore(store.id, {
        shop_policies: parseShopPolicies({
          has_physical_store: hasPhysicalStore,
          address,
          hours,
          default_delivery_business_days: defaultDays,
          delivery_fee: deliveryFee,
          free_delivery_above: freeAbove,
          same_day_delivery: sameDay,
          next_day_delivery: nextDay,
          service_area: serviceArea,
          return_days: returnDays,
          returns_allowed: returnsAllowed,
          exchange_allowed: exchangeAllowed,
          refund_days_after_cancel: refundDays,
          return_note: returnNote,
          current_offer_note: offerNote,
          pickup_note: pickupNote,
        }),
      })
      await refreshStore()
      setNotice('Shop policies saved')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save shop policies'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Shop policies"
        subtitle="Delivery, returns, hours — Chat Boat uses these facts"
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-4">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
        <p className="text-sm text-gray-500">
          Leave a field blank if staff should check. Chat Boat will not invent a fee, date, or
          discount.
        </p>
        <ToggleRow label="Physical shop" value={hasPhysicalStore} onValueChange={setHasPhysicalStore} />
        <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Input
          label="Shop hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="Mon–Sat 10am–8pm"
        />
        <Input
          label="Default delivery (business days)"
          value={defaultDays}
          onChange={(e) => setDefaultDays(e.target.value)}
          inputMode="numeric"
          placeholder="e.g. 2"
        />
        <Input
          label="Delivery fee"
          value={deliveryFee}
          onChange={(e) => setDeliveryFee(e.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Free delivery above"
          value={freeAbove}
          onChange={(e) => setFreeAbove(e.target.value)}
          inputMode="decimal"
        />
        <ToggleRow label="Same-day delivery" value={sameDay} onValueChange={setSameDay} />
        <ToggleRow label="Next-day delivery" value={nextDay} onValueChange={setNextDay} />
        <Input
          label="Service area"
          value={serviceArea}
          onChange={(e) => setServiceArea(e.target.value)}
          placeholder="Kerala"
        />
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-bold tracking-wide text-gray-600">Returns</p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['Not set', null],
                ['Yes', true],
                ['No', false],
              ] as const
            ).map(([label, value]) => {
              const selected = returnsAllowed === value
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setReturnsAllowed(value)}
                  className={`rounded-2xl border px-3 py-3 text-[13px] font-bold ${selected ? 'border-brand-primary bg-brand-primary text-white' : 'border-gray-200 bg-surface text-gray-700'}`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <Input
          label="Return window (days)"
          value={returnDays}
          onChange={(e) => setReturnDays(e.target.value)}
          inputMode="numeric"
        />
        <ToggleRow label="Exchange allowed" value={exchangeAllowed} onValueChange={setExchangeAllowed} />
        <Input
          label="Refund after cancel (days)"
          value={refundDays}
          onChange={(e) => setRefundDays(e.target.value)}
          inputMode="numeric"
        />
        <Input
          label="Return note"
          value={returnNote}
          onChange={(e) => setReturnNote(e.target.value)}
          multiline
        />
        <Input
          label="Current offer"
          value={offerNote}
          onChange={(e) => setOfferNote(e.target.value)}
          placeholder="Leave blank if none"
        />
        <Input label="Pickup note" value={pickupNote} onChange={(e) => setPickupNote(e.target.value)} />
        <Button label={saving ? 'Saving…' : 'Save policies'} onClick={() => void save()} disabled={saving || !store} />
        <p className="text-sm text-gray-500">
          Slow items: set extra delivery days on the product. A delayed order: open the order and add
          a promised date, delay note, courier, or tracking link.
        </p>
      </div>
    </main>
  )
}
