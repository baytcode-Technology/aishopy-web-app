'use client'

import { formatMoney } from '@/core/lib/format-money'
import { getVariantStockLabel, stockLabelToneClass } from '@/core/lib/product-inventory'
import type { Product, ProductVariant } from '@/core/types/product'
import { unitPrice } from './types'

type Props = {
  product: Product | null
  variants: ProductVariant[]
  loading?: boolean
  currency?: string
  onSelectVariant: (variant: ProductVariant) => void
}

export function OrderVariantPickerBody({
  product,
  variants,
  loading,
  currency,
  onSelectVariant,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
      </div>
    )
  }

  return (
    <div>
      {variants.map((variant) => {
        const price = product ? unitPrice(product, variant) : 0
        const stockLabel = product ? getVariantStockLabel(product, variant) : null
        const imageUri = variant.image_url ?? product?.thumbnail_url ?? null
        return (
          <button
            key={variant.id}
            type="button"
            className="flex w-full items-center gap-3 border-b border-gray-100 py-3.5 text-left"
            onClick={() => onSelectVariant(variant)}
          >
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
              {imageUri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUri} alt="" className="h-12 w-12 object-cover" />
              ) : (
                <span className="text-gray-400">▢</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-[15px] font-semibold text-ink">{variant.name}</p>
              <p className="mt-0.5 text-[13px] text-gray-500">
                {formatMoney(price, currency)}
                {stockLabel ? (
                  <span className={stockLabelToneClass(stockLabel.tone)}>{` · ${stockLabel.text}`}</span>
                ) : null}
              </p>
            </div>
          </button>
        )
      })}
      {variants.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No active variants</p>
      ) : null}
    </div>
  )
}
