const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3001'
const storefrontBaseDomain =
  process.env.NEXT_PUBLIC_STOREFRONT_BASE_DOMAIN?.trim() || 'aishopy.io'
const googleWebClientId = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? ''

export const env = {
  apiBaseUrl,
  appUrl,
  storefrontBaseDomain,
  googleWebClientId,
} as const

export function getGoogleRedirectUri(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/oauth`
  }
  return `${env.appUrl.replace(/\/$/, '')}/oauth`
}
