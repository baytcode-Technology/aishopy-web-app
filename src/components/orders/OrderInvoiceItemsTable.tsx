import { formatMoney } from '@/core/lib/format-money'
import { parseOrderItemSnapshot } from '@/core/lib/order-invoice'
import type { OrderItem } from '@/core/types/order'

type Props = {
  items: OrderItem[]
  currency: string
}

function HeaderCell({ label, className = '' }: { label: string; className?: string }) {
  return (
    <span className={`text-[11px] font-semibold uppercase text-gray-400 ${className}`}>{label}</span>
  )
}

export function OrderInvoiceItemsTable({ items, currency }: Props) {
  return (
    <div>
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <div className="w-11">
          <HeaderCell label="Item" />
        </div>
        <div className="min-w-0 flex-1">
          <HeaderCell label="Product" />
        </div>
        <div className="w-16">
          <HeaderCell label="Variant" />
        </div>
        <div className="flex w-8 justify-center">
          <HeaderCell label="Qty" />
        </div>
        <div className="flex w-[72px] justify-end">
          <HeaderCell label="Price" />
        </div>
      </div>

      {items.map((item) => {
        const { productName, variantName, thumbnailUrl } = parseOrderItemSnapshot(item)

        return (
          <div key={item.id} className="flex items-center gap-2 border-b border-gray-100 py-2.5">
            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnailUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-gray-400">▢</span>
              )}
            </div>

            <p className="min-w-0 flex-1 line-clamp-2 text-[13px] font-semibold text-ink">{productName}</p>
            <p className="w-16 line-clamp-2 text-[12px] text-gray-500">{variantName ?? ''}</p>
            <p className="w-8 text-center text-[13px] font-semibold text-ink">{item.quantity}</p>
            <p className="w-[72px] text-right text-[13px] font-semibold text-ink">
              {formatMoney(item.total_price, currency)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
