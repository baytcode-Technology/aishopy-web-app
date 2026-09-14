'use client'

import { formatMoney } from '@/core/lib/format-money'
import {
  getProductListStockLabel,
  stockLabelToneClass,
  variantStockSummary,
} from '@/core/lib/product-inventory'
import { getProductStatus } from '@/core/lib/product-status'
import type { Product } from '@/core/types/product'
import { useMemo, useState } from 'react'
import { OrderSearchBar } from './OrderSearchBar'

function variantCount(product: Product): number {
  const summary = variantStockSummary(product)
  if (summary) return summary.count
  const n = (product.metadata as { variant_count?: number } | undefined)?.variant_count
  return typeof n === 'number' && n > 0 ? n : 0
}

type Props = {
  products: Product[]
  loading?: boolean
  selecting?: boolean
  currency?: string
  onSelectProduct: (product: Product) => void
}

export function OrderProductPickerBody({
  products,
  loading,
  selecting,
  currency,
  onSelectProduct,
}: Props) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const active = products.filter((p) => getProductStatus(p) === 'active')
    if (!q) return active
    return active.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, search])

  return (
    <div className="flex flex-col gap-3">
      <OrderSearchBar value={search} onChange={setSearch} />

      {loading || selecting ? (
        <div className="flex items-center justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No products found</p>
      ) : (
        <div>
          {filtered.map((product) => {
            const variants = variantCount(product)
            const stockLabel = getProductListStockLabel(product)
            const status = getProductStatus(product)
            const statusLabel = status === 'active' ? 'Active' : status

            return (
              <button
                key={product.id}
                type="button"
                className="flex w-full items-center gap-3 border-b border-gray-100 py-3.5 text-left"
                onClick={() => onSelectProduct(product)}
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                  {product.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.thumbnail_url} alt="" className="h-12 w-12 object-cover" />
                  ) : (
                    <span className="text-gray-400">▢</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{product.name}</p>
                  <p className="mt-0.5 text-[13px] text-gray-500">
                    {variants > 0 ? (
                      <>
                        {stockLabel ? (
                          <span className={stockLabelToneClass(stockLabel.tone)}>{stockLabel.text}</span>
                        ) : null}
                        {stockLabel ? ' · ' : null}
                        {variants} variants · {statusLabel}
                      </>
                    ) : (
                      <>
                        {formatMoney(Number(product.base_price), currency)} · {statusLabel}
                        {stockLabel ? (
                          <span className={stockLabelToneClass(stockLabel.tone)}>
                            {` · ${stockLabel.text}`}
                          </span>
                        ) : null}
                      </>
                    )}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
