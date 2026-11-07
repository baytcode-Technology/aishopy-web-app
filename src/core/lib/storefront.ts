import { env } from '@/core/config/env'
import { slugify } from '@/core/lib/slugify'

export function buildSubdomainUrl(slug: string): string {
  const domain = env.storefrontBaseDomain
  const protocol = domain.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${slug}.${domain}`
}

export function buildProductSlug(product: { id: number; name: string }): string {
  return `${slugify(product.name)}${product.id ? `-${product.id}` : ''}`
}

export function buildStorefrontOrigin(input: {
  slug: string
  customDomain?: string | null
  customDomainStatus?: string | null
}): string {
  const domain = input.customDomain?.trim().toLowerCase()
  if (input.customDomainStatus === 'active' && domain) {
    return `https://${domain}`
  }
  return buildSubdomainUrl(input.slug)
}

export function buildStorefrontProductUrl(
  storeSlug: string,
  product: { id: number; name: string },
  variantId?: number | null,
  store?: { custom_domain?: string | null; custom_domain_status?: string | null } | null,
): string {
  const origin = buildStorefrontOrigin({
    slug: storeSlug,
    customDomain: store?.custom_domain,
    customDomainStatus: store?.custom_domain_status,
  })
  const base = `${origin}/product/${buildProductSlug(product)}`
  if (variantId != null) {
    return `${base}?variant=${variantId}`
  }
  return base
}
