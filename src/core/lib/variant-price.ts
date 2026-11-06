export function variantSellingPrice(
  basePrice: number,
  variant?: { price?: number | null; price_delta?: number } | null,
): number {
  const base = Number(basePrice)
  if (!variant) return base
  if (variant.price !== null && variant.price !== undefined) return Number(variant.price)
  if (variant.price === null) return base
  return base + Number(variant.price_delta ?? 0)
}

export function variantPriceDraft(
  variant: { price?: number | null; price_delta?: number } | null | undefined,
  basePrice: number,
): string {
  if (!variant) return ''
  if (variant.price !== null && variant.price !== undefined) return String(variant.price)
  if (variant.price === null || Number(variant.price_delta ?? 0) === 0) return ''
  return String(variantSellingPrice(basePrice, variant))
}

/** Empty means follow the product price. A number, including 0, is the variant price. */
export function parseVariantPrice(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const price = Number(trimmed)
  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Enter a valid price')
  }
  return price
}
