import type { Product } from '@/core/types/product'

export const MAX_PRODUCT_IMAGES = 15

export type ProductMediaItem = {
  id: string
  uri: string
  remoteUrl?: string
  pending?: { file: File; name: string; type: string }
}

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

export function mediaId() {
  return `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function productToMediaItems(product: Product): ProductMediaItem[] {
  const urls =
    product.images.length > 0
      ? product.images
      : product.thumbnail_url
        ? [product.thumbnail_url]
        : []

  return urls.map((url) => ({
    id: `remote-${url}`,
    uri: url,
    remoteUrl: url,
  }))
}

export function resolveThumbnailId(
  items: ProductMediaItem[],
  thumbnailUrl: string | null,
): string | null {
  if (!thumbnailUrl || items.length === 0) return items[0]?.id ?? null
  const match = items.find((i) => i.uri === thumbnailUrl || i.remoteUrl === thumbnailUrl)
  return match?.id ?? items[0]?.id ?? null
}

export function revokePendingMedia(items: ProductMediaItem[]) {
  for (const item of items) {
    if (item.pending) URL.revokeObjectURL(item.uri)
  }
}

export async function resolveProductMediaForSave(
  storeId: number,
  items: ProductMediaItem[],
  thumbnailId: string | null,
  upload: (storeId: number, files: File[]) => Promise<string[]>,
): Promise<{ images: string[]; thumbnail_url: string }> {
  if (items.length === 0) {
    throw new Error('At least one product image is required')
  }

  const pending = items.filter((i) => i.pending)
  let uploaded: string[] = []
  if (pending.length > 0) {
    uploaded = await upload(
      storeId,
      pending.map((p) => p.pending!.file),
    )
  }

  const orderedUrls: string[] = []
  let uploadIdx = 0
  for (const item of items) {
    if (item.pending) {
      orderedUrls.push(uploaded[uploadIdx]!)
      uploadIdx += 1
    } else if (item.remoteUrl) {
      orderedUrls.push(item.remoteUrl)
    }
  }

  const thumbIndex = items.findIndex((i) => i.id === thumbnailId)
  const thumbnail_url = thumbIndex >= 0 ? orderedUrls[thumbIndex]! : orderedUrls[0]!

  return { images: orderedUrls, thumbnail_url }
}
