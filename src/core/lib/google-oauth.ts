import { env, getGoogleRedirectUri } from '@/core/config/env'

const PENDING_KEY = 'aishopy_google_oauth_pending'

export type GoogleOAuthPending = {
  codeVerifier: string
  state: string
  redirectUri: string
}

function randomString(bytes = 32): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return base64Url(array)
}

function base64Url(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64Url(digest)
}

export function persistGoogleOAuthPending(session: GoogleOAuthPending): void {
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(session))
}

export function loadGoogleOAuthPending(): GoogleOAuthPending | null {
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as GoogleOAuthPending
  } catch {
    return null
  }
}

export function clearGoogleOAuthPending(): void {
  sessionStorage.removeItem(PENDING_KEY)
}

export async function startGoogleOAuth(): Promise<void> {
  if (!env.googleWebClientId) {
    throw new Error('Google sign-in is not configured')
  }

  const codeVerifier = randomString(64)
  const state = randomString(16)
  const redirectUri = getGoogleRedirectUri()
  const codeChallenge = await sha256(codeVerifier)

  persistGoogleOAuthPending({ codeVerifier, state, redirectUri })

  const params = new URLSearchParams({
    client_id: env.googleWebClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    access_type: 'offline',
    prompt: 'select_account',
  })

  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}
