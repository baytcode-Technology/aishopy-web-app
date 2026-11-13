'use client'

import {
  hasVideoInput,
  TrackingBarcodeScanner,
  type CameraProblem,
} from '@/components/orders/TrackingBarcodeScanner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { updateOrder } from '@/core/api/orders'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Order } from '@/core/types/order'
import { useCallback, useEffect, useState } from 'react'

type Props = {
  order: Order
  storeId: number
  courierTracking: boolean
  saving: boolean
  onSavingChange: (saving: boolean) => void
  onUpdated: (order: Order) => void
}

function formatPromisedLabel(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const date = new Date(`${trimmed}T00:00:00`)
  if (Number.isNaN(date.getTime())) return trimmed
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function orderHasCourier(order: Order): boolean {
  return Boolean(
    order.courier_name?.trim() || order.tracking_number?.trim() || order.tracking_url?.trim()
  )
}

export function OrderDeliveryCard({
  order,
  storeId,
  courierTracking,
  saving,
  onSavingChange,
  onUpdated,
}: Props) {
  const [open, setOpen] = useState(false)
  const [promisedBy, setPromisedBy] = useState('')
  const [delayNote, setDelayNote] = useState('')
  const [courierName, setCourierName] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [cameraNote, setCameraNote] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void hasVideoInput().then((available) => {
      if (active) setCameraReady(available)
    })
    return () => {
      active = false
    }
  }, [])

  const closeScanner = useCallback(() => setScanOpen(false), [])
  const onScanned = useCallback((scan: { trackingNumber: string; courierName: string }) => {
    setTrackingNumber(scan.trackingNumber)
    setCourierName((current) => (current.trim() ? current : scan.courierName || current))
    setScanOpen(false)
  }, [])
  const onCameraProblem = useCallback((problem: CameraProblem) => {
    setScanOpen(false)
    setCameraNote(
      problem === 'denied'
        ? 'Camera access is off. Type the tracking number instead.'
        : 'Camera not available. Type the tracking number instead.',
    )
  }, [])

  useEffect(() => {
    setPromisedBy(order.promised_by ?? '')
    setDelayNote(order.delay_note ?? '')
    setCourierName(order.courier_name ?? '')
    setTrackingNumber(order.tracking_number ?? '')
    setTrackingUrl(order.tracking_url ?? '')
  }, [order.id, order.promised_by, order.delay_note, order.courier_name, order.tracking_number, order.tracking_url])

  const showCourier = courierTracking || orderHasCourier(order)
  const dateLabel = formatPromisedLabel(order.promised_by)
  const courierLabel = order.courier_name?.trim()
  const summary = ['Delivery', dateLabel ?? 'No date yet', courierLabel || null].filter(Boolean).join(' · ')

  const save = async () => {
    if (saving) return
    onSavingChange(true)
    setError(null)
    try {
      const res = await updateOrder(order.id, {
        store_id: storeId,
        promised_by: promisedBy.trim() || null,
        delay_note: delayNote.trim() || null,
        courier_name: showCourier ? courierName.trim() || null : order.courier_name ?? null,
        tracking_number: showCourier ? trackingNumber.trim() || null : order.tracking_number ?? null,
        tracking_url: showCourier ? trackingUrl.trim() || null : order.tracking_url ?? null,
      })
      onUpdated({ ...order, ...res.data.order, customers: order.customers, items: order.items })
      setOpen(false)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save delivery details'))
    } finally {
      onSavingChange(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-surface">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="text-[15px] font-semibold text-ink">{summary}</span>
        <span className="text-sm font-bold text-ink">{open ? '−' : '+'}</span>
      </button>

      {open ? (
        <div className="flex flex-col gap-3 border-t border-gray-200 px-4 pb-4 pt-3">
          {error ? <p className="text-sm text-danger">{error}</p> : null}
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
            placeholder="Extra 2 days"
            multiline
          />
          {showCourier ? (
            <>
              <Input label="Courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} />
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <Input
                    label="Tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                </div>
                {cameraReady ? (
                  <Button
                    label="Scan"
                    variant="outline"
                    className="shrink-0"
                    style={{ width: 'auto' }}
                    onClick={() => {
                      setCameraNote(null)
                      setScanOpen(true)
                    }}
                  />
                ) : null}
              </div>
              {cameraNote ? (
                <p className="text-[13px] leading-5 text-gray-500">{cameraNote}</p>
              ) : null}
              <TrackingBarcodeScanner
                open={scanOpen}
                onClose={closeScanner}
                onScanned={onScanned}
                onCameraProblem={onCameraProblem}
              />
              <Input
                label="Tracking URL"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
              />
            </>
          ) : null}
          <Button label="Save delivery" onClick={() => void save()} disabled={saving} />
        </div>
      ) : null}
    </div>
  )
}
