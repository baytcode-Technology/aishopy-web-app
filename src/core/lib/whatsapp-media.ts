import { getValidAccessToken } from '@/core/api/client'
import { env } from '@/core/config/env'

export function buildWhatsAppMediaUrl(mediaId: string, storeId: number): string {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const qs = new URLSearchParams({ store_id: String(storeId) }).toString()
  return `${base}/api/whatsapp/media/${encodeURIComponent(mediaId)}?${qs}`
}

export function mediaUrlRequiresAuth(uri: string): boolean {
  return uri.includes('/api/whatsapp/media/')
}

export async function getWhatsAppMediaAuthHeaders(): Promise<Record<string, string>> {
  const token = await getValidAccessToken()
  return { Authorization: `Bearer ${token}` }
}

const blobUrlCache = new Map<string, string>()

export async function resolveAuthenticatedMediaUrl(uri: string): Promise<string> {
  if (!mediaUrlRequiresAuth(uri)) return uri
  const cached = blobUrlCache.get(uri)
  if (cached) return cached

  const headers = await getWhatsAppMediaAuthHeaders()
  const res = await fetch(uri, { headers })
  if (!res.ok) {
    throw new Error('Failed to load media')
  }
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  blobUrlCache.set(uri, objectUrl)
  return objectUrl
}
