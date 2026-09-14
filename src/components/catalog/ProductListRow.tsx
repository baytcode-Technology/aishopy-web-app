import { EmptyThumb } from '@/components/catalog/EmptyThumb'
import { ProductStatusBadge } from '@/components/catalog/ProductStatusBadge'
import { getProductListStockLabel, stockLabelToneClass, variantStockSummary } from '@/core/lib/product-inventory'
import type { Product } from '@/core/types/product'
import Link from 'next/link'

function variantCount(product: Product): number | null {
  const summary = variantStockSummary(product)
  if (summary) return summary.count
  const n = (product.metadata as { variant_count?: number } | undefined)?.variant_count
  return typeof n === 'number' && n > 0 ? n : null
}

export function ProductListRow({ product }: { product: Product }) {
  const variants = variantCount(product)
  const stockLabel = getProductListStockLabel(product)
  const inventoryTone = stockLabel ? stockLabelToneClass(stockLabel.tone) : 'text-gray-500'

  return (
    <Link
      href={`/products/${product.id}`}
      className="flex items-center gap-3 border-b border-gray-200 py-3.5"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {product.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail_url} alt="" className="h-12 w-12 object-cover" />
        ) : (
          <EmptyThumb />
        )}
      </div>
      <div className="min-w-0 flex-1 pr-2">
        <p className="truncate text-[15px] font-semibold text-ink">{product.name}</p>
        {stockLabel ? (
          <p className={`mt-0.5 text-[13px] ${inventoryTone}`}>
            {stockLabel.text}
            {variants != null ? <span className="text-gray-500">{` · ${variants} variants`}</span> : null}
          </p>
        ) : variants != null ? (
          <p className="mt-0.5 text-[13px] text-gray-500">{`${variants} variants`}</p>
        ) : null}
      </div>
      <ProductStatusBadge product={product} />
    </Link>
  )
}
