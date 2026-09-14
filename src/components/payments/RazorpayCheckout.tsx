'use client'

import { Modal } from '@/components/ui/Modal'
import { useEffect, useRef } from 'react'

export type RazorpayPaymentResult = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type CheckoutSession = {
  key_id: string
  order_id: string
  amount: number
  currency: string
  store_name: string
}

type Props = {
  open: boolean
  checkout: CheckoutSession | null
  customerEmail?: string | null
  customerPhone?: string | null
  customerName?: string | null
  description?: string
  onSuccess: (payment: RazorpayPaymentResult) => void
  onDismiss: () => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void
  on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void
}

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Razorpay) return Promise.resolve()
  const existing = document.querySelector('script[data-aishopy-razorpay]')
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Checkout failed')))
    })
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.aishopyRazorpay = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Checkout failed'))
    document.body.appendChild(script)
  })
}

export function RazorpayCheckout({
  open,
  checkout,
  customerEmail,
  customerPhone,
  customerName,
  description,
  onSuccess,
  onDismiss,
}: Props) {
  const openedRef = useRef(false)

  useEffect(() => {
    if (!open || !checkout) {
      openedRef.current = false
      return
    }
    if (openedRef.current) return
    openedRef.current = true

    let cancelled = false

    void (async () => {
      try {
        await loadRazorpayScript()
        if (cancelled || !window.Razorpay) {
          onDismiss()
          return
        }

        const rzp = new window.Razorpay({
          key: checkout.key_id,
          amount: checkout.amount,
          currency: checkout.currency,
          order_id: checkout.order_id,
          name: checkout.store_name,
          description: description ?? 'Razorpay connection test — ₹1',
          prefill: {
            email: customerEmail ?? '',
            contact: customerPhone ?? '',
            name: customerName ?? '',
          },
          theme: { color: '#3EB056' },
          handler: (response: RazorpayPaymentResult) => {
            onSuccess(response)
          },
          modal: {
            ondismiss: () => {
              onDismiss()
            },
          },
        })
        rzp.on('payment.failed', () => {
          onDismiss()
        })
        rzp.open()
      } catch {
        onDismiss()
      }
    })()

    return () => {
      cancelled = true
    }
  }, [open, checkout, customerEmail, customerPhone, customerName, description, onSuccess, onDismiss])

  if (!open) return null

  return (
    <Modal open={open} title="Complete payment" onClose={onDismiss}>
      <p className="text-center text-[15px] text-gray-500">Opening secure checkout…</p>
    </Modal>
  )
}
