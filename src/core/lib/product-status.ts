import type { Product, ProductStatus } from '@/core/types/product'

const VALID: ProductStatus[] = ['active', 'draft', 'unlisted']

export function getProductStatus(product: Pick<Product, 'status' | 'is_active'>): ProductStatus {
  if (VALID.includes(product.status as ProductStatus)) {
    return product.status
  }
  return product.is_active ? 'active' : 'draft'
}

export type ProductStatusTheme = {
  label: string
  badgeBg: string
  badgeText: string
}

export const PRODUCT_STATUS_THEME: Record<ProductStatus, ProductStatusTheme> = {
  active: { label: 'Active', badgeBg: '#E8F8EC', badgeText: '#3EB056' },
  draft: { label: 'Draft', badgeBg: '#FFF7ED', badgeText: '#EA580C' },
  unlisted: { label: 'Unlisted', badgeBg: '#FEF2F2', badgeText: '#EF4444' },
}

export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = VALID
