'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { broadcastInstagramOAuth, parseInstagramOAuthRedirectParams } from '@/core/lib/instagram-oauth'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function InstagramOAuthCallback() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const finishedRef = useRef(false)

  useEffect(() => {
    if (finishedRef.current) return
    finishedRef.current = true

    const parsed = parseInstagramOAuthRedirectParams(searchParams)
    if (parsed.error) {
      broadcastInstagramOAuth({ error: parsed.error })
      setError(parsed.error)
      window.setTimeout(() => {
        window.location.replace('/instagram-connect')
      }, 50)
      return
    }

    if (parsed.connected) {
      broadcastInstagramOAuth({ connected: true, username: parsed.username })
    }

    window.setTimeout(() => {
      window.location.replace('/instagram-connect')
    }, 50)
  }, [searchParams])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black">
      <AppLogo href="" />
      {error ? (
        <p className="mt-4 px-6 text-center text-sm text-[#E11D48]">{error}</p>
      ) : (
        <div
          className="mt-6 h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-brand-primary"
          aria-label="Loading"
        />
      )}
    </main>
  )
}

export default function InstagramOAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-brand-primary" />
        </main>
      }
    >
      <InstagramOAuthCallback />
    </Suspense>
  )
}
