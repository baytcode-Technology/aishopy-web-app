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
