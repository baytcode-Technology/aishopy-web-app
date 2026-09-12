'use client'

import { fetchSupportAdminSummary, type SupportAdminSummary } from '@/core/api/support'
import { useCallback, useEffect, useState } from 'react'

const EMPTY: SupportAdminSummary = {
  escalated_count: 0,
  unread_messages: 0,
  awaiting_manual_count: 0,
}

export function useSupportAdminSummary(enabled: boolean) {
  const [summary, setSummary] = useState<SupportAdminSummary>(EMPTY)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setSummary(EMPTY)
      return
    }
    try {
      const res = await fetchSupportAdminSummary()
      setSummary(res.data)
    } catch {
      setSummary(EMPTY)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { summary, refresh }
}
