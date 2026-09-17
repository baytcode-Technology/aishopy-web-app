'use client'

import { usePlatformAdmin } from '@/hooks/usePlatformAdmin'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

/** Prefer stack back; fall back to Admin home when platform admin has no store. */
export function usePlatformAdminBack(fallbackHref = '/platform-admin/workspace/support') {
  const router = useRouter()
  const { store } = useStore()
  const { isPlatformAdmin } = usePlatformAdmin()

  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    if (isPlatformAdmin && !store) {
      router.replace(fallbackHref)
      return
    }
    router.back()
  }, [isPlatformAdmin, store, fallbackHref, router])
}
