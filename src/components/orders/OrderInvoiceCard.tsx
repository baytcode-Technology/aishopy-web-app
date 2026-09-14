'use client'

import { OrderInvoiceItemsTable } from '@/components/orders/OrderInvoiceItemsTable'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import {
  countOrderItems,
  formatOrderInvoiceDate,
  formatShippingAddress,
  formatStorefrontHost,
  formatStoreWhatsApp,
  getOrderChannelLabel,
  hasShippingAddress,
  isPosOrder,
} from '@/core/lib/order-invoice'
import { downloadOrderInvoice, printOrderInvoice } from '@/core/lib/order-invoice-export'
import { formatOrderNumber } from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'
import type { Store } from '@/core/types/store'
import { useState } from 'react'

type Props = {
  order: Order
  store: Store
}

function InvoiceMetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="shrink-0 text-[12px] text-gray-500">{label}</span>
      <p className="flex-1 text-right text-[14px] font-semibold text-ink">{value}</p>
    </div>
  )
}

function InvoiceTotalRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={bold ? 'text-[15px] font-bold text-ink' : 'text-[14px] text-gray-600'}>
        {label}
      </span>
      <span className={bold ? 'text-[16px] font-extrabold text-ink' : 'text-[14px] font-semibold text-ink'}>
        {value}
      </span>
    </div>
  )
}

export function OrderInvoiceCard({ order, store }: Props) {
  const [printing, setPrinting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currency = store.currency
  const items = order.items ?? []
  const itemCount = countOrderItems(items)
  const channel = getOrderChannelLabel(order)
  const showAddress = !isPosOrder(order) && hasShippingAddress(order.shipping_address)
  const addressLines = formatShippingAddress(order.shipping_address)
  const customerName =
    order.customers?.name?.trim() ||
    order.customers?.whatsapp_number ||
    (isPosOrder(order) ? 'Walk-in customer' : 'Customer')

  const runPrint = async () => {
    if (printing || downloading) return
    setPrinting(true)
    setError(null)
    try {
      await printOrderInvoice({ order, store })
    } catch (e) {
      setError(getErrorMessage(e, 'Could not print invoice'))
    } finally {
      setPrinting(false)
    }
  }

  const runDownload = async () => {
    if (printing || downloading) return
    setDownloading(true)
    setError(null)
    try {
      await downloadOrderInvoice({ order, store })
    } catch (e) {
      setError(getErrorMessage(e, 'Could not download invoice'))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-gray-300 bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 gap-1 pr-2">
          <p className="text-[20px] font-extrabold leading-tight text-ink">{store.name}</p>
          <p className="text-[13px] text-gray-500">{formatStorefrontHost(store.slug)}</p>
          <p className="text-[13px] text-gray-500">{formatStoreWhatsApp(store)}</p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void runPrint()}
            disabled={printing || downloading}
            aria-label="Print invoice"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 disabled:opacity-50"
          >
            {printing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18 3H6v4h12V3ZM19 9H5a3 3 0 0 0-3 3v4h4v5h12v-5h4v-4a3 3 0 0 0-3-3Zm-3 10H8v-4h8v4Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => void runDownload()}
            disabled={printing || downloading}
            aria-label="Download invoice"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 disabled:opacity-50"
          >
            {downloading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3v10.2l3.6-3.6 1.4 1.4L12 17 7 11l1.4-1.4L11 13.2V3h1ZM5 19h14v2H5v-2Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {error ? <p className="text-[13px] font-medium text-[#E11D48]">{error}</p> : null}

      <div className="h-px bg-gray-200" />

      <div className="flex flex-col gap-2">
        <InvoiceMetaRow label="Invoice No" value={formatOrderNumber(order.order_number)} />
        <InvoiceMetaRow label="Order date" value={formatOrderInvoiceDate(order.created_at)} />
      </div>

      <div className="h-px bg-gray-200" />

      <div>
        <p className="mb-2 text-[15px] font-bold text-ink">Items</p>
        <OrderInvoiceItemsTable items={items} currency={currency} />
      </div>

      <div>
        <InvoiceTotalRow
          label={`Items total (${itemCount})`}
          value={formatMoney(order.subtotal, currency)}
        />
        <InvoiceTotalRow label="Subtotal" value={formatMoney(order.subtotal, currency)} bold />
        {order.discount_amount > 0 ? (
          <InvoiceTotalRow
            label="Discount"
            value={`-${formatMoney(order.discount_amount, currency)}`}
          />
        ) : null}
        {order.shipping_fee > 0 ? (
          <InvoiceTotalRow label="Shipping" value={formatMoney(order.shipping_fee, currency)} />
        ) : null}
        {order.tax_amount > 0 ? (
          <InvoiceTotalRow label="Tax" value={formatMoney(order.tax_amount, currency)} />
        ) : null}
        <div className="my-2 h-px bg-gray-200" />
        <InvoiceTotalRow label="Total" value={formatMoney(order.total, currency)} bold />
      </div>

      <div className="h-px bg-gray-200" />

      <div>
        <p className="mb-2 text-[15px] font-bold text-ink">Order details</p>
        <p className="text-[12px] text-gray-500">Channel</p>
        <p className="mt-0.5 text-[14px] font-semibold text-ink">{channel}</p>
        <p className="mt-2 text-[12px] text-gray-500">Customer</p>
        <p className="mt-0.5 text-[14px] font-semibold text-ink">{customerName}</p>
      </div>

      {showAddress ? (
        <>
          <div className="h-px bg-gray-200" />
          <div>
            <p className="mb-2 text-[15px] font-bold text-ink">Delivery address</p>
            {addressLines.map((line, index) => (
              <p key={`${line}-${index}`} className="text-[14px] leading-5 text-ink">
                {line}
              </p>
            ))}
          </div>
        </>
      ) : null}

      {order.notes?.trim() ? (
        <>
          <div className="h-px bg-gray-200" />
          <div>
            <p className="mb-1 text-[15px] font-bold text-ink">Notes</p>
            <p className="text-[14px] leading-5 text-ink">{order.notes.trim()}</p>
          </div>
        </>
      ) : null}
    </div>
  )
}
