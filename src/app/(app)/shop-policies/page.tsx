'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Switch } from '@/components/ui/Switch'
import { updateMyStore } from '@/core/api/stores'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import { EMPTY_SHOP_POLICIES, parseShopPolicies } from '@/core/types/shop-policies'
import { useUnsavedChangesExit } from '@/hooks/useUnsavedChangesExit'
import { useStore } from '@/providers/store-provider'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

function numField(value: number | null): string {
  return value == null ? '' : String(value)
}

function joinSummary(parts: Array<string | false>, empty: string): string {
  const line = parts.filter((part): part is string => Boolean(part)).join(' · ')
  return line || empty
}

function SectionCard({
  title,
  summary,
  open,
  onToggle,
  children,
}: {
  title: string
  summary: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-300 bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-ink">{title}</span>
          <span className="mt-1 block truncate text-[13px] text-gray-500">{summary}</span>
        </span>
        <MenuIcon
          name={open ? 'chevron-down' : 'chevron-right'}
          className="h-3 w-3 shrink-0 text-ink"
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-gray-200 px-4 pb-4 pt-3">{children}</div>
      ) : null}
    </section>
  )
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
    <div className="flex items-center justify-between gap-3">
      <p className="text-[15px] font-medium text-ink">{label}</p>
      <Switch value={value} onValueChange={onValueChange} aria-label={label} onTrack="primary" />
    </div>
  )
}

function SwitchGroup({ children }: { children: ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-gray-200">{children}</div>
}

function SwitchRow({ children, divided }: { children: ReactNode; divided?: boolean }) {
  return (
    <div className={`px-3 py-3 ${divided ? 'border-t border-gray-200' : ''}`}>{children}</div>
  )
}

function ReturnsChoice({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (next: boolean | null) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-bold tracking-wide text-gray-600">Returns</p>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-gray-100 p-1">
        {(
          [
            ['Not set', null],
            ['Yes', true],
            ['No', false],
          ] as const
        ).map(([label, next]) => {
          const selected = value === next
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(next)}
              className={`rounded-lg px-3 py-2.5 text-[13px] font-semibold ${
                selected ? 'bg-ink text-brand-on-primary' : 'text-ink'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function ShopPoliciesPage() {
  const { store, refreshStore } = useStore()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [shopOpen, setShopOpen] = useState(false)
  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [returnsOpen, setReturnsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
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
  const [courierTracking, setCourierTracking] = useState(false)

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
    setCourierTracking(p.courier_tracking)
  }, [store])

  const savedKey = useMemo(() => {
    if (!store) return ''
    const p = parseShopPolicies(store.shop_policies ?? EMPTY_SHOP_POLICIES)
    return JSON.stringify({
      hasPhysicalStore: p.has_physical_store,
      address: p.address ?? '',
      hours: p.hours ?? '',
      defaultDays: numField(p.default_delivery_business_days),
      deliveryFee: numField(p.delivery_fee),
      freeAbove: numField(p.free_delivery_above),
      sameDay: p.same_day_delivery,
      nextDay: p.next_day_delivery,
      serviceArea: p.service_area ?? '',
      returnDays: numField(p.return_days),
      returnsAllowed: p.returns_allowed,
      exchangeAllowed: p.exchange_allowed,
      refundDays: numField(p.refund_days_after_cancel),
      returnNote: p.return_note ?? '',
      offerNote: p.current_offer_note ?? '',
      pickupNote: p.pickup_note ?? '',
      courierTracking: p.courier_tracking,
    })
  }, [store])

  const isDirty =
    savedKey !== '' &&
    savedKey !==
      JSON.stringify({
        hasPhysicalStore,
        address,
        hours,
        defaultDays,
        deliveryFee,
        freeAbove,
        sameDay,
        nextDay,
        serviceArea,
        returnDays,
        returnsAllowed,
        exchangeAllowed,
        refundDays,
        returnNote,
        offerNote,
        pickupNote,
        courierTracking,
      })

  const feeNumber = Number(deliveryFee)
  const shopSummary = hasPhysicalStore
    ? joinSummary(['Physical shop', hours.trim()], 'Physical shop')
    : 'Online only'
  const deliverySummary = joinSummary(
    [
      defaultDays.trim() ? `${defaultDays.trim()} days` : false,
      deliveryFee.trim() && Number.isFinite(feeNumber)
        ? `${formatMoney(feeNumber, store?.currency)} fee`
        : false,
      courierTracking ? 'Courier tracking on' : false,
    ],
    'Not set',
  )
  const returnsSummary = joinSummary(
    [
      returnsAllowed === true ? 'Returns yes' : returnsAllowed === false ? 'Returns no' : false,
      returnDays.trim() ? `${returnDays.trim()} days` : false,
      exchangeAllowed ? 'Exchange' : false,
    ],
    'Not set',
  )
  const notesSummary = joinSummary(
    [offerNote.trim() ? 'Offer set' : false, pickupNote.trim() ? 'Pickup note set' : false],
    'None',
  )

  const save = useCallback(async (): Promise<boolean> => {
    if (!store?.id) return false
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
          courier_tracking: courierTracking,
        }),
      })
      await refreshStore()
      setNotice('Shop policies saved')
      return true
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save shop policies'))
      return false
    } finally {
      setSaving(false)
    }
  }, [
    address,
    courierTracking,
    defaultDays,
    deliveryFee,
    exchangeAllowed,
    freeAbove,
    hasPhysicalStore,
    hours,
    nextDay,
    offerNote,
    pickupNote,
    refreshStore,
    refundDays,
    returnDays,
    returnNote,
    returnsAllowed,
    sameDay,
    serviceArea,
    store?.id,
  ])

  const { requestBack, dialog } = useUnsavedChangesExit({
    isDirty,
    isLoading: !store,
    onSave: save,
  })

  return (
    <main className="flex min-h-full flex-col bg-gray-100">
      <CatalogHeader title="Shop policies" onBack={requestBack} />
      <div className="flex flex-1 flex-col gap-4 px-5 pb-6 pt-4">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <p className="px-1 text-[13px] leading-5 text-gray-500">
          Leave a field blank if staff should check. Chat Boat will not invent a fee, date, or
          discount.
        </p>

        <SectionCard
          title="Shop"
          summary={shopSummary}
          open={shopOpen}
          onToggle={() => setShopOpen((open) => !open)}
        >
          <SwitchGroup>
            <SwitchRow>
              <ToggleRow
                label="Physical shop"
                value={hasPhysicalStore}
                onValueChange={setHasPhysicalStore}
              />
            </SwitchRow>
          </SwitchGroup>
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} multiline />
          <Input
            label="Shop hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Mon–Sat 10am–8pm"
          />
        </SectionCard>

        <SectionCard
          title="Delivery"
          summary={deliverySummary}
          open={deliveryOpen}
          onToggle={() => setDeliveryOpen((open) => !open)}
        >
          <SwitchGroup>
            <SwitchRow>
              <ToggleRow
                label="Courier tracking"
                value={courierTracking}
                onValueChange={setCourierTracking}
              />
            </SwitchRow>
            <div className="border-t border-gray-200 px-3 py-3">
              <p className="text-[13px] leading-5 text-gray-500">
                Promised date and delay note always show on an order. Courier and tracking appear
                when Courier tracking is on.
              </p>
            </div>
            <SwitchRow divided>
              <ToggleRow label="Same-day delivery" value={sameDay} onValueChange={setSameDay} />
            </SwitchRow>
            <SwitchRow divided>
              <ToggleRow label="Next-day delivery" value={nextDay} onValueChange={setNextDay} />
            </SwitchRow>
          </SwitchGroup>
          <Input
            label="Default delivery (business days)"
            value={defaultDays}
            onChange={(e) => setDefaultDays(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 2"
          />
          <Input
            label={`Delivery fee (${store?.currency ?? 'INR'})`}
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            inputMode="decimal"
          />
          <Input
            label={`Free delivery above (${store?.currency ?? 'INR'})`}
            value={freeAbove}
            onChange={(e) => setFreeAbove(e.target.value)}
            inputMode="decimal"
          />
          <Input
            label="Service area"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Kerala"
          />
        </SectionCard>

        <SectionCard
          title="Returns"
          summary={returnsSummary}
          open={returnsOpen}
          onToggle={() => setReturnsOpen((open) => !open)}
        >
          <SwitchGroup>
            <SwitchRow>
              <ToggleRow
                label="Exchange allowed"
                value={exchangeAllowed}
                onValueChange={setExchangeAllowed}
              />
            </SwitchRow>
          </SwitchGroup>
          <Input
            label="Return window (days)"
            value={returnDays}
            onChange={(e) => setReturnDays(e.target.value)}
            inputMode="numeric"
          />
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
          <ReturnsChoice value={returnsAllowed} onChange={setReturnsAllowed} />
        </SectionCard>

        <SectionCard
          title="Notes"
          summary={notesSummary}
          open={notesOpen}
          onToggle={() => setNotesOpen((open) => !open)}
        >
          <Input
            label="Current offer"
            value={offerNote}
            onChange={(e) => setOfferNote(e.target.value)}
            placeholder="Leave blank if none"
            multiline
          />
          <Input
            label="Pickup note"
            value={pickupNote}
            onChange={(e) => setPickupNote(e.target.value)}
            multiline
          />
        </SectionCard>
      </div>
      <div className="sticky bottom-0 border-t border-gray-200 bg-surface px-5 py-3">
        <Button
          label={saving ? 'Saving…' : 'Save policies'}
          onClick={() => void save()}
          disabled={saving || !store}
        />
      </div>
      {dialog}
    </main>
  )
}
