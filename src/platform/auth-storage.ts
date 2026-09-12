import type { AuthSession, AuthUser } from '@/core/types/auth'

const ACCESS_TOKEN_KEY = 'aishopy_access_token'
const REFRESH_TOKEN_KEY = 'aishopy_refresh_token'
const USER_KEY = 'aishopy_auth_user'
const SESSION_META_KEY = 'aishopy_session_meta'

export type StoredSessionMeta = {
  expiresAt: number
  expiresIn: number
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function getItem(key: string): string | null {
  return storage()?.getItem(key) ?? null
}

function setItem(key: string, value: string): void {
  storage()?.setItem(key, value)
}

function removeItem(key: string): void {
  storage()?.removeItem(key)
}

export async function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY)
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY)
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  setItem(ACCESS_TOKEN_KEY, accessToken)
  setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export async function saveAuthUser(user: AuthUser): Promise<void> {
  setItem(USER_KEY, JSON.stringify(user))
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const raw = getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export async function saveSessionMeta(meta: StoredSessionMeta): Promise<void> {
  setItem(SESSION_META_KEY, JSON.stringify(meta))
}

export async function getSessionMeta(): Promise<StoredSessionMeta | null> {
  const raw = getItem(SESSION_META_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSessionMeta
  } catch {
    return null
  }
}

export async function saveAuthSession(session: AuthSession, user: AuthUser): Promise<void> {
  await saveTokens(session.accessToken, session.refreshToken)
  await saveAuthUser(user)
  await saveSessionMeta({
    expiresAt: session.expiresAt,
    expiresIn: session.expiresIn,
  })
}

export async function clearTokens(): Promise<void> {
  removeItem(ACCESS_TOKEN_KEY)
  removeItem(REFRESH_TOKEN_KEY)
  removeItem(USER_KEY)
  removeItem(SESSION_META_KEY)
}
