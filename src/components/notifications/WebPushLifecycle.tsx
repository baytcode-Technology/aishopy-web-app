'use client'

import { NotificationNavigateListener } from '@/components/notifications/NotificationNavigateListener'
import {
  registerServiceWorker,
  syncBrowserPushIfGranted,
} from '@/core/lib/web-push'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useEffect } from 'react'

/** Registers the push SW and re-syncs an existing browser subscription to the active store. */
export function WebPushLifecycle() {
  const { isAuthenticated } = useAuth()
  const { store } = useStore()

  useEffect(() => {
    if (!isAuthenticated) return
    void registerServiceWorker()
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !store?.id) return
    void syncBrowserPushIfGranted(store.id)
  }, [isAuthenticated, store?.id])

  return <NotificationNavigateListener />
}
