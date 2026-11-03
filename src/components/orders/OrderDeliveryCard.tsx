'use client'

import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateOrder } from '@/core/api/orders'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Order } from '@/core/types/order'
import { useEffect, useState } from 'react'

type Props = {
  order: Order
  storeId: number
  saving: boolean
  onSavingChange: (saving: boolean) => void
  onUpdated: (order: Order) => void
}

export function OrderDeliveryCard({
  order,
  storeId,
  saving,
  onSavingChange,
  onUpdated,
}: Props) {
  const [promisedBy, setPromisedBy] = useState('')
  const [delayNote, setDelayNote] = useState('')
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPromisedBy(order.promised_by ?? '')
    setDelayNote(order.delay_note ?? '')
    setCourierName(order.courier_name ?? '')
    setTrackingNumber(order.tracking_number ?? '')
    setTrackingUrl(order.tracking_url ?? '')
  }, [order.id, order.promised_by, order.delay_note, order.courier_name, order.tracking_number, order.tracking_url])

  const save = async () => {
    if (saving) return
    onSavingChange(true)
    setError(null)
    try {
      const res = await updateOrder(order.id, {
        store_id: storeId,
        promised_by: promisedBy.trim() || null,
        delay_note: delayNote.trim() || null,
        courier_name: courierName.trim() || null,
        tracking_number: trackingNumber.trim() || null,
        tracking_url: trackingUrl.trim() || null,
      })
      onUpdated({ ...order, ...res.data.order, customers: order.customers, items: order.items })
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save delivery details'))
    } finally {
      onSavingChange(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-surface p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
        Delivery & delay
      </p>
      {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      <Input
        label="Promised by"
        type="date"
        value={promisedBy}
        onChange={(e) => setPromisedBy(e.target.value)}
      />
      <Input
        label="Delay note"
        value={delayNote}
        onChange={(e) => setDelayNote(e.target.value)}
        placeholder="Courier delay — extra 2 days"
        multiline
      />
      <Input label="Courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
      <Input
        label="Tracking number"
        value={trackingNumber}
        onChange={(e) => setTrackingNumber(e.target.value)}
      />
      <Input
        label="Tracking URL"
        value={trackingUrl}
        onChange={(e) => setTrackingUrl(e.target.value)}
      />
      <Button label="Save delivery" onClick={() => void save()} disabled={saving} />
    </div>
  )
}
