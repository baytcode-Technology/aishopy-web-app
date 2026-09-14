import {
  effectiveProductStockQty,
  effectiveVariantStockQty,
  tracksVariantStock,
} from '@/core/lib/product-inventory'
import type { Product, ProductVariant } from '@/core/types/product'

export type CartLine = {
  key: string
  productId: number
  variantId: number | null
  quantity: number
  product: Product
  variant: ProductVariant | null
}

export function cartLineKey(productId: number, variantId: number | null): string {
  return `${productId}:${variantId ?? 'base'}`
}

export function unitPrice(product: Product, variant: ProductVariant | null): number {
  return Number(product.base_price) + Number(variant?.price_delta ?? 0)
}

export function stockForLine(line: CartLine): number | null {
  if (line.variant) {
    if (!tracksVariantStock(line.product, line.variant)) return null
    return effectiveVariantStockQty(line.product, line.variant)
  }
  if (!line.product.track_inventory || line.product.mark_as_non_inventory) return null
  return effectiveProductStockQty(line.product)
}

export function isLineOverStock(line: CartLine): boolean {
  const stock = stockForLine(line)
  return stock !== null && line.quantity > stock
}

export function cartHasInsufficientStock(lines: CartLine[]): boolean {
  return lines.some(isLineOverStock)
}
