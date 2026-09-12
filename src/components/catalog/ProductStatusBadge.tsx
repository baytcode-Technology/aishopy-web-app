import {
  getProductStatus,
  PRODUCT_STATUS_THEME,
} from '@/core/lib/product-status'
import type { Product } from '@/core/types/product'

export function ProductStatusBadge({ product }: { product: Pick<Product, 'status' | 'is_active'> }) {
  const status = getProductStatus(product)
  const theme = PRODUCT_STATUS_THEME[status]
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
    >
      {theme.label}
    </span>
  )
}
