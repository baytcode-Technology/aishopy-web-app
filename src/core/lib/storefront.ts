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

export type StorefrontLinkFields = {
  custom_domain?: string | null
  custom_domain_status?: string | null
  public_link_host?: string | null
}

export type StorefrontLinkStore = StorefrontLinkFields & {
  slug: string
}

export function buildStorefrontOrigin(input: {
  slug: string
  customDomain?: string | null
  customDomainStatus?: string | null
  publicLinkHost?: string | null
}): string {
  const domain = input.customDomain?.trim().toLowerCase()
  const shareCustom = input.publicLinkHost !== 'subdomain'
  if (input.customDomainStatus === 'active' && domain && shareCustom) {
    return `https://${domain}`
  }
  return buildSubdomainUrl(input.slug)
}

export function storefrontAddress(
  store: StorefrontLinkStore | null | undefined,
): { host: string; url: string } | null {
  if (!store?.slug) return null
  const url = buildStorefrontOrigin({
    slug: store.slug,
    customDomain: store.custom_domain,
    customDomainStatus: store.custom_domain_status,
    publicLinkHost: store.public_link_host,
  })
  return { url, host: url.replace(/^https?:\/\//, '') }
}

export function buildStorefrontProductUrl(
  storeSlug: string,
  product: { id: number; name: string },
  variantId?: number | null,
  store?: StorefrontLinkFields | null,
): string {
  const origin = buildStorefrontOrigin({
    slug: storeSlug,
    customDomain: store?.custom_domain,
    customDomainStatus: store?.custom_domain_status,
    publicLinkHost: store?.public_link_host,
  })
  const base = `${origin}/product/${buildProductSlug(product)}`
  if (variantId != null) {
    return `${base}?variant=${variantId}`
  }
  return base
}
