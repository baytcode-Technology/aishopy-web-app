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
  pickerSelectedBg: string
  pickerSelectedBorder: string
  pickerSelectedText: string
}

export const PRODUCT_STATUS_THEME: Record<ProductStatus, ProductStatusTheme> = {
  active: {
    label: 'Active',
    badgeBg: '#E8F8EC',
    badgeText: '#3EB056',
    pickerSelectedBg: '#3EB056',
    pickerSelectedBorder: '#3EB056',
    pickerSelectedText: '#FFFFFF',
  },
  draft: {
    label: 'Draft',
    badgeBg: '#FFF7ED',
    badgeText: '#EA580C',
    pickerSelectedBg: '#F97316',
    pickerSelectedBorder: '#F97316',
    pickerSelectedText: '#FFFFFF',
  },
  unlisted: {
    label: 'Unlisted',
    badgeBg: '#FEF2F2',
    badgeText: '#EF4444',
    pickerSelectedBg: '#EF4444',
    pickerSelectedBorder: '#EF4444',
    pickerSelectedText: '#FFFFFF',
  },
}

export const PRODUCT_STATUS_OPTIONS: ProductStatus[] = VALID
