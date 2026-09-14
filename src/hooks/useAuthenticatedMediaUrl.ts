'use client'

import { resolveAuthenticatedMediaUrl } from '@/core/lib/whatsapp-media'
import { useEffect, useState } from 'react'

export function useAuthenticatedMediaUrl(uri: string | null | undefined) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!uri) {
      setSrc(null)
      setFailed(false)
      return
    }

    let cancelled = false
    setFailed(false)
    void resolveAuthenticatedMediaUrl(uri)
      .then((next) => {
        if (!cancelled) setSrc(next)
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null)
          setFailed(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [uri])

  return { src, failed }
}
