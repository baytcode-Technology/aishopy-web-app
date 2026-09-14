'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { completeWhatsAppOnboarding } from '@/core/api/whatsapp-connect'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  broadcastWhatsAppOAuth,
  loadWhatsAppOAuthStoreId,
  parseOAuthCallbackUrl,
} from '@/core/lib/whatsapp-oauth'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function WhatsAppOAuthCallback() {
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const finishedRef = useRef(false)

  useEffect(() => {
    if (finishedRef.current) return
    finishedRef.current = true

    const href = typeof window !== 'undefined' ? window.location.href : ''
    const parsed = parseOAuthCallbackUrl(href)
    const code = parsed.code ?? searchParams.get('code')
    const state = parsed.state ?? searchParams.get('state')
    const oauthError = parsed.error ?? searchParams.get('error') ?? searchParams.get('error_reason')

    if (oauthError) {
      broadcastWhatsAppOAuth({ error: oauthError })
      setError(oauthError)
      window.setTimeout(() => {
        window.location.replace('/connect-whatsapp')
      }, 50)
      return
    }

    if (!code) {
      window.setTimeout(() => {
        window.location.replace('/connect-whatsapp')
      }, 50)
      return
    }

    broadcastWhatsAppOAuth({ code, state })

    const storeId = loadWhatsAppOAuthStoreId()
    void (async () => {
      try {
        if (storeId) {
          await completeWhatsAppOnboarding(storeId, { code, state })
        }
      } catch (e: unknown) {
        setError(getErrorMessage(e, 'Connect failed'))
      } finally {
        window.setTimeout(() => {
          window.location.replace('/connect-whatsapp')
        }, 50)
      }
    })()
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

export default function WhatsAppOAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-600 border-t-brand-primary" />
        </main>
      }
    >
      <WhatsAppOAuthCallback />
    </Suspense>
  )
}
