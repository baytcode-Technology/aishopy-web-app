export const MAX_PRODUCT_IMAGES = 15

export function remainingProductImageSlots(currentCount: number): number {
  return Math.max(0, MAX_PRODUCT_IMAGES - currentCount)
}

export function productImageLimitMessage(
  currentCount: number,
  selectedCount: number,
): string | null {
  const remaining = remainingProductImageSlots(currentCount)
  if (remaining === 0) {
    return `You can add up to ${MAX_PRODUCT_IMAGES} product images. Remove an image before adding another.`
  }
  if (selectedCount > remaining) {
    return `You can add up to ${MAX_PRODUCT_IMAGES} product images. Only ${remaining} more ${
      remaining === 1 ? 'image is' : 'images are'
    } allowed.`
  }
  return null
}
