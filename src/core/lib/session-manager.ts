import { endpoints } from '@/core/api/endpoints'
import { env } from '@/core/config/env'
import { expFromAccessToken } from '@/core/lib/jwt-claims'
import type { ApiResponse, VerifyOtpData } from '@/core/types/auth'
import {
  getAccessToken,
  getRefreshToken,
  getSessionMeta,
  saveAuthSession,
} from '@/platform/auth-storage'

export class SessionExpiredError extends Error {
  constructor(message = 'Session expired') {
    super(message)
    this.name = 'SessionExpiredError'
  }
}

export class SigningOutAbortError extends Error {
  constructor() {
    super('Signing out')
    this.name = 'SigningOutAbortError'
  }
}

let signingOut = false

export function setSigningOut(value: boolean): void {
  signingOut = value
}

export function isSigningOut(): boolean {
  return signingOut
}

type TokensRefreshedListener = (accessToken: string) => void

const tokensRefreshedListeners = new Set<TokensRefreshedListener>()
let refreshPromise: Promise<string> | null = null

export function onTokensRefreshed(listener: TokensRefreshedListener): () => void {
  tokensRefreshedListeners.add(listener)
  return () => {
    tokensRefreshedListeners.delete(listener)
  }
}

function notifyTokensRefreshed(accessToken: string): void {
  for (const listener of tokensRefreshedListeners) {
    listener(accessToken)
  }
}

async function callRefreshApi(refreshToken: string): Promise<ApiResponse<VerifyOtpData>> {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const res = await fetch(`${base}${endpoints.authRefresh}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const message =
      typeof body === 'object' && body !== null && 'error' in body
        ? String((body as { error?: { message?: string } }).error?.message ?? res.statusText)
        : res.statusText
    throw new SessionExpiredError(message || 'Session refresh failed')
  }

  return body as ApiResponse<VerifyOtpData>
}

export async function isAccessTokenExpired(bufferSeconds = 120): Promise<boolean> {
  const token = await getAccessToken()
  if (!token) return true

  const meta = await getSessionMeta()
  if (meta?.expiresAt) {
    return meta.expiresAt <= Math.floor(Date.now() / 1000) + bufferSeconds
  }

  const exp = expFromAccessToken(token)
  if (exp) {
    return exp <= Math.floor(Date.now() / 1000) + bufferSeconds
  }

  return false
}

export async function refreshSession(): Promise<string> {
  if (signingOut) {
    throw new SigningOutAbortError()
  }
  if (refreshPromise) {
    return refreshPromise
  }

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken()
    if (!refreshToken) {
      throw new SessionExpiredError()
    }

    const res = await callRefreshApi(refreshToken)
    await saveAuthSession(res.data.session, res.data.user)
    notifyTokensRefreshed(res.data.session.accessToken)
    return res.data.session.accessToken
  })().finally(() => {
    refreshPromise = null
  })

  return refreshPromise
}

export async function ensureValidSession(): Promise<string> {
  if (signingOut) {
    throw new SigningOutAbortError()
  }
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    throw new SessionExpiredError()
  }

  const needsRefresh = await isAccessTokenExpired()
  if (needsRefresh) {
    return refreshSession()
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    return refreshSession()
  }

  return accessToken
}
