import {
  getProductStatus,
  PRODUCT_STATUS_THEME,
} from '@/core/lib/product-status'
import type { Product, ProductStatus } from '@/core/types/product'

export function ProductStatusBadge({
  product,
  status,
}: {
  product?: Pick<Product, 'status' | 'is_active'>
  status?: ProductStatus
}) {
  const resolved = status ?? (product ? getProductStatus(product) : 'active')
  const theme = PRODUCT_STATUS_THEME[resolved]
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
    >
      {theme.label}
    </span>
  )
}
