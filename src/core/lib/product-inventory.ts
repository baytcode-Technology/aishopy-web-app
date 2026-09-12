import type { Product, ProductVariant, VariantStockSummary } from '@/core/types/product'

export function isNonInventoryProduct(product: Product, hasVariants = false): boolean {
  if (hasVariants) return false
  return product.mark_as_non_inventory === true
}

export function isMarkedSoldProduct(product: Product, hasVariants = false): boolean {
  if (hasVariants) return false
  return product.mark_as_sold === true
}

export function isNonInventoryVariant(
  product: Product,
  variant: ProductVariant,
  hasVariants = true,
): boolean {
  if (!hasVariants) return isNonInventoryProduct(product, false)
  return variant.mark_as_non_inventory === true
}

export function isMarkedSoldVariant(
  product: Product,
  variant: ProductVariant,
  hasVariants = true,
): boolean {
  if (!hasVariants) return isMarkedSoldProduct(product, false)
  return variant.mark_as_sold === true
}

export type ProductStockLabel = {
  text: string
  tone: 'default' | 'danger' | 'muted' | 'success'
}

export function stockLabelToneClass(tone: ProductStockLabel['tone']): string {
  if (tone === 'danger') return 'text-[#991B1B]'
  if (tone === 'success') return 'text-brand-green'
  if (tone === 'muted') return 'text-gray-400'
  return 'text-gray-500'
}

export function getProductStockLabel(product: Product): ProductStockLabel | null {
  if (isNonInventoryProduct(product, false)) {
    return { text: 'No inventory tracking', tone: 'muted' }
  }
  if (!product.track_inventory) return null
  if (isMarkedSoldProduct(product, false)) {
    return { text: 'Sold · 0 available', tone: 'danger' }
  }
  const qty = product.stock_qty
  const text = qty === 1 ? '1 available' : `${qty} available`
  return { text, tone: qty <= 0 ? 'danger' : 'default' }
}

export function variantStockSummary(product: Product): VariantStockSummary | null {
  const summary = product.variant_summary
  return summary && summary.count > 0 ? summary : null
}

export function getProductListStockLabel(product: Product): ProductStockLabel | null {
  const summary = variantStockSummary(product)
  if (!summary) return getProductStockLabel(product)

  if (summary.non_inventory_count === summary.count) {
    return { text: 'Non inventory', tone: 'success' }
  }
  if (summary.sold_out_count === summary.count) {
    return { text: 'Sold out', tone: 'danger' }
  }
  if (
    summary.non_inventory_count === 0 &&
    summary.sold_out_count === 0 &&
    summary.min_qty === summary.max_qty
  ) {
    const qty = summary.min_qty
    return {
      text: qty === 1 ? '1 available' : `${qty} available`,
      tone: qty <= 0 ? 'danger' : 'default',
    }
  }
  return { text: 'Custom', tone: 'default' }
}

export function effectiveVariantStockQty(product: Product, variant: ProductVariant): number {
  if (isMarkedSoldVariant(product, variant, true)) return 0
  return variant.stock_qty
}

export function getVariantCardInventoryFlags(
  _product: Product,
  variant: ProductVariant,
): { showSoldOut: boolean; showNonInventory: boolean } {
  return {
    showSoldOut: variant.mark_as_sold === true,
    showNonInventory: variant.mark_as_non_inventory === true,
  }
}

export function getVariantAvailabilityLabel(
  product: Product,
  variant: ProductVariant,
): ProductStockLabel | null {
  if (isNonInventoryVariant(product, variant, true)) return null
  if (!product.track_inventory) return null
  const qty = effectiveVariantStockQty(product, variant)
  const text = qty === 1 ? '1 available' : `${qty} available`
  return { text, tone: qty <= 0 ? 'danger' : 'default' }
}

export function getProductStockDisplayValue(product: Product): string {
  if (isNonInventoryProduct(product, false)) return '—'
  if (!product.track_inventory) return '—'
  if (isMarkedSoldProduct(product, false)) return 'Sold (0)'
  return String(product.stock_qty)
}
