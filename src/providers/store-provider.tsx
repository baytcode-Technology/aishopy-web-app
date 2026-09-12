'use client'

import { fetchMyStores } from '@/core/api/stores'
import { normalizeEntityId } from '@/core/lib/normalize-entity-id'
import { buildSubdomainUrl } from '@/core/lib/storefront'
import type { Store, StoreAccessRole, StoreListItem } from '@/core/types/store'
import {
  clearStoreSession,
  getStoreSession,
  normalizeStoreSession,
  saveStoreSession,
} from '@/platform/store-storage'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type StoreContextValue = {
  store: Store | null
  stores: StoreListItem[]
  role: StoreAccessRole | null
  subdomainUrl: string | null
  sessionStoreId: number | null
  sessionStoreName: string | null
  isLoading: boolean
  refreshStores: () => Promise<StoreListItem[]>
  switchStore: (storeId: number) => Promise<boolean>
  hydrateActiveStore: () => Promise<boolean>
  activateStoreSession: (
    store: Store,
    subdomainUrl: string,
    role?: StoreAccessRole,
  ) => Promise<void>
  clearStore: () => Promise<void>
}

const StoreContext = createContext<StoreContextValue | null>(null)

function normalizeStoreFromApi(raw: Store | null): Store | null {
  if (!raw) return null
  const id = normalizeEntityId(raw.id)
  if (id == null) return null
  return { ...raw, id }
}

async function persistSession(store: Store, subdomainUrl: string, role: StoreAccessRole) {
  await saveStoreSession({
    storeId: store.id,
    slug: store.slug,
    name: store.name,
    subdomainUrl,
    role,
  })
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(null)
  const [stores, setStores] = useState<StoreListItem[]>([])
  const [role, setRole] = useState<StoreAccessRole | null>(null)
  const [subdomainUrl, setSubdomainUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionStoreId, setSessionStoreId] = useState<number | null>(null)
  const [sessionStoreName, setSessionStoreName] = useState<string | null>(null)

  useEffect(() => {
    void getStoreSession().then((session) => {
      const normalized = normalizeStoreSession(session)
      if (normalized) {
        setSubdomainUrl(normalized.subdomainUrl)
        setSessionStoreId(normalized.storeId)
        setSessionStoreName(normalized.name)
        setRole(normalized.role)
      }
    })
  }, [])

  const activateStoreSession = useCallback(
    async (next: Store, url: string, nextRole: StoreAccessRole = 'owner') => {
      const normalized = normalizeStoreFromApi(next)
      if (!normalized) return
      setStore(normalized)
      setSubdomainUrl(url)
      setRole(nextRole)
      setSessionStoreId(normalized.id)
      setSessionStoreName(normalized.name)
      await persistSession(normalized, url, nextRole)
    },
    [],
  )

  const refreshStores = useCallback(async () => {
    const res = await fetchMyStores()
    const list = res.data.stores
      .map((item) => {
        const normalized = normalizeStoreFromApi(item.store)
        if (!normalized) return null
        return { store: normalized, role: item.role }
      })
      .filter((item): item is StoreListItem => item != null)
    setStores(list)
    return list
  }, [])

  const switchStore = useCallback(
    async (storeId: number) => {
      const match = stores.find((item) => item.store.id === storeId)
      if (!match) {
        const list = await refreshStores()
        const found = list.find((item) => item.store.id === storeId)
        if (!found) return false
        const url = buildSubdomainUrl(found.store.slug)
        await activateStoreSession(found.store, url, found.role)
        return true
      }
      const url = buildSubdomainUrl(match.store.slug)
      await activateStoreSession(match.store, url, match.role)
      return true
    },
    [stores, refreshStores, activateStoreSession],
  )

  const hydrateActiveStore = useCallback(async () => {
    setIsLoading(true)
    try {
      const session = normalizeStoreSession(await getStoreSession())
      if (!session) return false
      setSessionStoreId(session.storeId)
      setSessionStoreName(session.name)
      setRole(session.role)
      setSubdomainUrl(session.subdomainUrl)
      return switchStore(session.storeId)
    } finally {
      setIsLoading(false)
    }
  }, [switchStore])

  const clearStore = useCallback(async () => {
    setStore(null)
    setStores([])
    setRole(null)
    setSubdomainUrl(null)
    setSessionStoreId(null)
    setSessionStoreName(null)
    await clearStoreSession()
  }, [])

  const value = useMemo(
    () => ({
      store,
      stores,
      role,
      subdomainUrl,
      sessionStoreId,
      sessionStoreName,
      isLoading,
      refreshStores,
      switchStore,
      hydrateActiveStore,
      activateStoreSession,
      clearStore,
    }),
    [
      store,
      stores,
      role,
      subdomainUrl,
      sessionStoreId,
      sessionStoreName,
      isLoading,
      refreshStores,
      switchStore,
      hydrateActiveStore,
      activateStoreSession,
      clearStore,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) {
    throw new Error('useStore must be used within StoreProvider')
  }
  return ctx
}
