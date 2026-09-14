'use client'

import { DetailHeader } from '@/components/catalog/DetailHeader'
import { OrderInvoiceCard } from '@/components/orders/OrderInvoiceCard'
import { OrderPaymentActions } from '@/components/orders/OrderPaymentActions'
import { OrderPaymentProofCard } from '@/components/orders/OrderPaymentProofCard'
import { OrderRazorpayPaymentCard } from '@/components/orders/OrderRazorpayPaymentCard'
import { OrderRazorpayPendingCard } from '@/components/orders/OrderRazorpayPendingCard'
import { OrderStatusPickerSheet } from '@/components/orders/OrderStatusPickerSheet'
import { OrderStatusRow } from '@/components/orders/OrderStatusRow'
import { fetchOrder, updateOrder } from '@/core/api/orders'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatOrderNumber, type OrderStatusField } from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'
import { useOrdersUnread } from '@/providers/orders-unread-provider'
import { useStore } from '@/providers/store-provider'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { store } = useStore()
  const { markOrderViewed } = useOrdersUnread()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pickerField, setPickerField] = useState<OrderStatusField | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(id) || !store?.id) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetchOrder(store.id, id)
      setOrder(res.data)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load order'))
    } finally {
      setLoading(false)
    }
  }, [id, store?.id])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!Number.isFinite(id)) return
    void markOrderViewed(id).catch(() => {
      // List badge refresh is best-effort; detail still renders.
    })
  }, [id, markOrderViewed])

  const confirmPaymentReceived = async () => {
    if (!order || !store?.id || saving) return
    setSaving(true)
    setNotice(null)
    try {
      await updateOrder(order.id, {
        store_id: store.id,
        payment_status: 'paid',
        order_status: order.order_status === 'pending' ? 'confirmed' : order.order_status,
      })
      const refreshed = await fetchOrder(store.id, order.id)
      setOrder(refreshed.data)
      setNotice('Payment marked as received')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not confirm payment'))
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (field: OrderStatusField, value: string) => {
    if (!order || !store?.id || saving) return
    setSaving(true)
    setNotice(null)
    try {
      const res = await updateOrder(order.id, {
        store_id: store.id,
        [field]: value,
      })
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              ...res.data.order,
              customers: prev.customers,
              items: prev.items,
            }
          : prev,
      )
      setNotice('Status updated')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update status'))
    } finally {
      setSaving(false)
    }
  }

  const currentPickerValue = pickerField && order ? String(order[pickerField]) : null

  return (
    <main className="relative min-h-full bg-gray-100 pb-10">
      <DetailHeader
        title={order ? `Order ${formatOrderNumber(order.order_number)}` : 'Order'}
        backHref="/orders"
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
        </div>
      ) : !order ? (
        <div className="flex items-center justify-center py-24">
          <p className="text-base font-semibold text-gray-500">{error ?? 'Order not found'}</p>
        </div>
      ) : (
        <div className="relative">
          {saving ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-surface/50">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 px-5 pb-8 pt-4">
            {error ? <p className="text-[13px] font-medium text-[#E11D48]">{error}</p> : null}
            {notice ? <p className="text-[13px] font-medium text-brand-green">{notice}</p> : null}

            {order.payment?.payment_proof_url ? (
              <OrderPaymentProofCard url={order.payment.payment_proof_url} />
            ) : null}
            {order.payment?.provider === 'razorpay' &&
            order.payment_status === 'paid' &&
            order.payment.provider_payment_id ? (
              <OrderRazorpayPaymentCard paymentId={order.payment.provider_payment_id} />
            ) : null}
            {order.payment?.provider === 'razorpay' &&
            order.order_status !== 'cancelled' &&
            order.payment_status !== 'paid' ? (
              <OrderRazorpayPendingCard failed={order.payment?.status === 'failed'} />
            ) : null}
            <OrderPaymentActions
              order={order}
              payment={order.payment ?? null}
              saving={saving}
              onConfirmPayment={() => void confirmPaymentReceived()}
            />
            <div>
              <OrderStatusRow
                field="order_status"
                value={order.order_status}
                onPress={() => {
                  if (!saving) setPickerField('order_status')
                }}
                disabled={saving}
              />
              <OrderStatusRow
                field="payment_status"
                value={order.payment_status}
                onPress={() => {
                  if (!saving) setPickerField('payment_status')
                }}
                disabled={saving}
              />
              <OrderStatusRow
                field="fulfillment_status"
                value={order.fulfillment_status}
                onPress={() => {
                  if (!saving) setPickerField('fulfillment_status')
                }}
                disabled={saving}
              />
            </div>

            {store ? <OrderInvoiceCard order={order} store={store} /> : null}
          </div>
        </div>
      )}

      <OrderStatusPickerSheet
        open={pickerField !== null}
        field={pickerField}
        currentValue={currentPickerValue}
        onClose={() => setPickerField(null)}
        onSelect={(value) => {
          if (!pickerField || saving) return
          const field = pickerField
          setPickerField(null)
          void handleStatusChange(field, value)
        }}
      />
    </main>
  )
}
