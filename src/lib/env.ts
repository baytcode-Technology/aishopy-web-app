const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim() ?? ''
const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? 'http://localhost:3001'

export const env = {
  apiBaseUrl,
  appUrl,
} as const
