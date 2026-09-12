import type { StoreSession } from '@/core/types/store'

const STORE_SESSION_KEY = 'aishopy_store_session'

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export async function getStoreSession(): Promise<StoreSession | null> {
  const raw = storage()?.getItem(STORE_SESSION_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoreSession
  } catch {
    return null
  }
}

export function normalizeStoreSession(session: StoreSession | null): StoreSession | null {
  if (!session) return null
  return {
    ...session,
    role: session.role ?? 'owner',
  }
}

export async function saveStoreSession(session: StoreSession): Promise<void> {
  storage()?.setItem(STORE_SESSION_KEY, JSON.stringify(session))
}

export async function clearStoreSession(): Promise<void> {
  storage()?.removeItem(STORE_SESSION_KEY)
}
