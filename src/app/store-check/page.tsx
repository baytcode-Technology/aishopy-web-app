'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { Button } from '@/components/ui/Button'
import { fetchSupportAdminStatus } from '@/core/api/support'
import { getErrorMessage } from '@/core/lib/api-error'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function StoreCheckPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { refreshStores, switchStore } = useStore()
  const router = useRouter()
  const [loadError, setLoadError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const hasRoutedRef = useRef(false)
  const isRunningRef = useRef(false)

  useEffect(() => {
    hasRoutedRef.current = false
    isRunningRef.current = false
  }, [retryKey])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    if (hasRoutedRef.current || isRunningRef.current) return
    isRunningRef.current = true

    let cancelled = false

    void (async () => {
      try {
        setLoadError(null)
        const [list, adminRes] = await Promise.all([
          refreshStores(),
          fetchSupportAdminStatus().catch(() => ({
            data: { isAdmin: false as boolean },
          })),
        ])

        if (cancelled || hasRoutedRef.current) return

        const isAdmin = adminRes.data.isAdmin
        hasRoutedRef.current = true

        if (list.length === 0) {
          router.replace(isAdmin ? '/home' : '/create-store')
          return
        }

        if (list.length === 1) {
          await switchStore(list[0].store.id)
          router.replace('/home')
          return
        }

        router.replace('/select-store')
      } catch (e) {
        if (cancelled) return
        hasRoutedRef.current = false
        setLoadError(getErrorMessage(e, 'Could not load your store'))
      } finally {
        isRunningRef.current = false
      }
    })()

    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, refreshStores, retryKey, router, switchStore])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-100 px-8">
      <AppLogo href="" />
      {loadError ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <p className="text-center text-sm text-gray-600">{loadError}</p>
          <Button label="Try again" onClick={() => setRetryKey((key) => key + 1)} />
        </div>
      ) : (
        <p className="font-semibold tracking-wide text-gray-500">Preparing your workspace…</p>
      )}
    </main>
  )
}
