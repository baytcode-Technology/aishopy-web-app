import { buildInvoiceHtml } from '@/core/lib/order-invoice'
import { formatOrderNumber } from '@/core/lib/order-status'
import type { Order } from '@/core/types/order'
import type { Store } from '@/core/types/store'

type InvoiceContext = {
  order: Order
  store: Store
}

function invoiceTitle(order: Order) {
  return `Invoice ${formatOrderNumber(order.order_number)}`
}

export async function printOrderInvoice({ order, store }: InvoiceContext): Promise<void> {
  const html = buildInvoiceHtml({ order, store })
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900')
  if (!popup) throw new Error('Allow popups to print the invoice')
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

export async function downloadOrderInvoice({ order, store }: InvoiceContext): Promise<void> {
  const html = buildInvoiceHtml({ order, store })
  const title = invoiceTitle(order)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${title.replace(/[^\w.-]+/g, '-')}.html`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
