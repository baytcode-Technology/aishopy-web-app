'use client'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppLogo } from '@/components/brand/AppLogo'
import { Button } from '@/components/ui/Button'
import { getStoreSession, normalizeStoreSession } from '@/platform/store-storage'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

function SelectStoreContent() {
  const { signOut } = useAuth()
  const { stores, store, refreshStores, switchStore, clearStore } = useStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [lastSessionStoreId, setLastSessionStoreId] = useState<number | null>(null)
  const selectingRef = useRef(false)

  useEffect(() => {
    void (async () => {
      setIsLoading(true)
      try {
        const session = normalizeStoreSession(await getStoreSession())
        setLastSessionStoreId(session?.storeId ?? null)
        await refreshStores()
      } finally {
        setIsLoading(false)
      }
    })()
  }, [refreshStores])

  const handleSelect = async (storeId: number) => {
    if (selectingRef.current) return
    selectingRef.current = true
    try {
      const ok = await switchStore(storeId)
      if (ok) router.replace('/products')
    } finally {
      selectingRef.current = false
    }
  }

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col bg-gray-100 px-5 py-14">
      <div className="mb-8 flex flex-col items-center">
        <AppLogo />
        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">
          Choose a workspace
        </h1>
        <p className="mt-2 px-4 text-center text-[15px] leading-6 text-gray-500">
          Which store do you want to open? You can switch anytime from Storefront in Settings.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {isLoading ? (
          <p className="text-center text-sm text-gray-500">Loading stores…</p>
        ) : (
          stores.map((item) => {
            const selected =
              item.store.id === store?.id || item.store.id === lastSessionStoreId
            return (
              <button
                key={item.store.id}
                type="button"
                onClick={() => void handleSelect(item.store.id)}
                className={`rounded-2xl border bg-surface px-4 py-4 text-left ${
                  selected ? 'border-ink' : 'border-gray-200'
                }`}
              >
                <p className="font-semibold text-ink">{item.store.name}</p>
                <p className="mt-1 text-sm text-gray-500">{item.store.slug}.aishopy.io</p>
              </button>
            )
          })
        )}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <Link href="/create-store" className="py-2 text-center text-[15px] font-semibold text-brand-green">
          Create a new store
        </Link>
        <Button label="Sign out" variant="ghost" onClick={() => void handleSignOut()} />
      </div>
    </main>
  )
}

export default function SelectStorePage() {
  return (
    <RequireAuth>
      <SelectStoreContent />
    </RequireAuth>
  )
}
