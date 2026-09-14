'use client'

import { formatMoney } from '@/core/lib/format-money'
import { isMarkedSoldProduct, isMarkedSoldVariant } from '@/core/lib/product-inventory'
import type { CartLine } from './types'
import { stockForLine, unitPrice } from './types'

type Props = {
  line: CartLine
  currency?: string
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function OrderCartLine({ line, currency, onQuantityChange, onRemove }: Props) {
  const price = unitPrice(line.product, line.variant)
  const lineTotal = price * line.quantity
  const stock = stockForLine(line)
  const markedSold = line.variant
    ? isMarkedSoldVariant(line.product, line.variant)
    : isMarkedSoldProduct(line.product)
  const showStockWarning = stock !== null && (stock < line.quantity || markedSold)
  const imageUri =
    line.variant?.image_url ?? line.product.thumbnail_url ?? line.product.images[0] ?? null

  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-gray-200 bg-surface">
      {showStockWarning ? (
        <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50 px-3 py-2">
          <span className="text-[12px] text-amber-800">⚠</span>
          <p className="flex-1 text-[12px] text-amber-800">
            {markedSold
              ? 'This item is marked as sold (0 in stock).'
              : `This product has ${stock} unit${stock === 1 ? '' : 's'} in stock.`}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 p-3">
        <div className="flex items-start gap-3">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
            {imageUri ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUri} alt="" className="h-14 w-14 object-cover" />
            ) : (
              <span className="text-gray-400">▢</span>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p className="line-clamp-2 text-[15px] font-semibold text-ink">{line.product.name}</p>
            {line.variant ? (
              <p className="mt-0.5 truncate text-[13px] text-gray-500">{line.variant.name}</p>
            ) : null}
            <p className="mt-1 text-[14px] font-semibold text-ink">{formatMoney(price, currency)}</p>
          </div>

          <button type="button" onClick={onRemove} className="p-1" aria-label="Remove item">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-500">
              ✕
            </span>
          </button>
        </div>

        <div className="flex items-center overflow-hidden rounded-xl border border-gray-200">
          <span className="flex-1 px-3 py-2.5 text-[14px] text-gray-500">Quantity</span>
          <div className="flex items-center">
            <button
              type="button"
              className="h-11 w-11 border-l border-gray-200 bg-gray-100 text-lg text-ink"
              onClick={() => onQuantityChange(Math.max(1, line.quantity - 1))}
            >
              −
            </button>
            <span className="w-10 text-center text-[15px] font-semibold text-ink">{line.quantity}</span>
            <button
              type="button"
              className="h-11 w-11 border-l border-gray-200 bg-gray-100 text-lg text-ink"
              onClick={() => onQuantityChange(line.quantity + 1)}
            >
              +
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[13px] text-gray-500">
            {formatMoney(price, currency)} × {line.quantity}
          </span>
          <span className="text-[15px] font-bold text-ink">{formatMoney(lineTotal, currency)}</span>
        </div>
      </div>
    </div>
  )
}
