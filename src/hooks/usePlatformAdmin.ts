'use client'

import { fetchSupportAdminStatus } from '@/core/api/support'
import { useEffect, useState } from 'react'

export function usePlatformAdmin() {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchSupportAdminStatus()
      .then((res) => {
        if (!cancelled) setIsPlatformAdmin(res.data.isAdmin)
      })
      .catch(() => {
        if (!cancelled) setIsPlatformAdmin(false)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { isPlatformAdmin, isLoading }
}
