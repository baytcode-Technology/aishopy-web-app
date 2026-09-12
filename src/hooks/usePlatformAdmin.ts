'use client'

import { fetchSupportAdminStatus } from '@/core/api/support'
import { useEffect, useState } from 'react'

export function usePlatformAdmin() {
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchSupportAdminStatus()
      .then((res) => {
        if (!cancelled) setIsPlatformAdmin(res.data.isAdmin)
      })
      .catch(() => {
        if (!cancelled) setIsPlatformAdmin(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { isPlatformAdmin }
}
