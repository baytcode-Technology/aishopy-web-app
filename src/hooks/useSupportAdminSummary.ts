'use client'

import { fetchSupportAdminSummary, type SupportAdminSummary } from '@/core/api/support'
import { useCallback, useEffect, useState } from 'react'

const EMPTY: SupportAdminSummary = {
  escalated_count: 0,
  unread_messages: 0,
  awaiting_manual_count: 0,
}

const POLL_MS = 5000

export function useSupportAdminSummary(enabled: boolean) {
  const [summary, setSummary] = useState<SupportAdminSummary>(EMPTY)

  const refresh = useCallback(async () => {
    if (!enabled) return
    try {
      const res = await fetchSupportAdminSummary()
      setSummary(res.data)
    } catch {
      // Keep last known counts.
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) {
      setSummary(EMPTY)
      return
    }

    void refresh()
    const interval = window.setInterval(() => void refresh(), POLL_MS)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, refresh])

  return { summary, refresh }
}
