import { env } from '@/core/config/env'
import {
  ensureValidSession,
  isSigningOut,
  refreshSession,
  SessionExpiredError,
  SigningOutAbortError,
} from '@/core/lib/session-manager'

type FetchOptions = RequestInit & {
  token?: string | null
}

export class ApiHttpError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiHttpError'
    this.status = status
    this.body = body
  }
}

let onSessionExpiredCallback: (() => void) | null = null

export function setOnSessionExpired(callback: (() => void) | null): void {
  onSessionExpiredCallback = callback
}

function buildUrl(path: string): string {
  const base = env.apiBaseUrl.replace(/\/$/, '')
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

function parseErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'object' && body !== null) {
    if ('error' in body) {
      const err = (body as { error?: { message?: string } }).error
      if (err?.message) return err.message
    }
    if ('message' in body && typeof (body as { message?: string }).message === 'string') {
      return (body as { message: string }).message
    }
  }
  return fallback
}

export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options
  const url = buildUrl(path)

  const res = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  })

  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }

  if (!res.ok) {
    const message = parseErrorMessage(body, res.statusText || `HTTP ${res.status}`)
    throw new ApiHttpError(message || `HTTP ${res.status}`, res.status, body)
  }

  return body as T
}

export async function authenticatedFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (isSigningOut()) {
    throw new SigningOutAbortError()
  }

  const run = async (isRetry: boolean): Promise<T> => {
    const token = await ensureValidSession()
    try {
      return await apiFetch<T>(path, { ...options, token })
    } catch (err) {
      if (err instanceof SigningOutAbortError) {
        throw err
      }
      if (err instanceof ApiHttpError && err.status === 401 && !isRetry) {
        if (isSigningOut()) {
          throw new SigningOutAbortError()
        }
        try {
          await refreshSession()
          return run(true)
        } catch (refreshErr) {
          if (refreshErr instanceof SigningOutAbortError) {
            throw refreshErr
          }
          if (!isSigningOut()) {
            onSessionExpiredCallback?.()
          }
          throw new SessionExpiredError()
        }
      }
      throw err
    }
  }

  return run(false)
}

export async function getValidAccessToken(): Promise<string> {
  if (isSigningOut()) {
    throw new SigningOutAbortError()
  }
  return ensureValidSession()
}
