import { unitPrice } from '@/components/orders/order-create/types'
import { formatMoney } from '@/core/lib/format-money'
import { buildStorefrontProductUrl } from '@/core/lib/storefront'
import type { Product, ProductVariant } from '@/core/types/product'

type BuildProductShareMessageInput = {
  product: Product
  variant: ProductVariant | null
  currency?: string
  storeSlug: string
}

export function buildProductShareMessage({
  product,
  variant,
  currency,
  storeSlug,
}: BuildProductShareMessageInput): string {
  const price = formatMoney(unitPrice(product, variant), currency)
  const title = variant ? `${product.name} — ${variant.name}` : product.name
  const url = buildStorefrontProductUrl(storeSlug, product, variant?.id ?? null)

  return `${title}\n${price}\n\n${url}`
}

/** Thumbnail for WhatsApp product share: variant image, then product cover, then first gallery image. */
export function resolveProductShareImageUrl(
  product: Product,
  variant: ProductVariant | null,
): string | null {
  const variantUrl = variant?.image_url?.trim()
  if (variantUrl) return variantUrl

  const thumb = product.thumbnail_url?.trim()
  if (thumb) return thumb

  const first = product.images.find(
    (url): url is string => typeof url === 'string' && url.trim().length > 0,
  )
  return first?.trim() ?? null
}
