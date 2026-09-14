'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  clearGoogleOAuthPending,
  loadGoogleOAuthPending,
} from '@/core/lib/google-oauth'
import { useAuth } from '@/providers/auth-provider'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'

function GoogleOAuthCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { signInWithGoogleAuthCode, signInWithGoogle } = useAuth()
  const [error, setError] = useState('')
  const finishedRef = useRef(false)

  useEffect(() => {
    if (finishedRef.current) return

    const code = searchParams.get('code')
    const idToken = searchParams.get('id_token')
    const oauthError = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (oauthError) {
      finishedRef.current = true
      clearGoogleOAuthPending()
      setError(errorDescription || oauthError)
      return
    }

    if (!code && !idToken) {
      finishedRef.current = true
      router.replace('/login')
      return
    }

    finishedRef.current = true

    void (async () => {
      try {
        if (idToken) {
          await signInWithGoogle(idToken)
          clearGoogleOAuthPending()
          router.replace('/store-check')
          return
        }

        const pending = loadGoogleOAuthPending()
        if (!pending || !code) {
          throw new Error('Google sign-in session expired. Try again.')
        }

        await signInWithGoogleAuthCode({
          code,
          redirectUri: pending.redirectUri,
          codeVerifier: pending.codeVerifier,
        })
        clearGoogleOAuthPending()
        router.replace('/store-check')
      } catch (e) {
        clearGoogleOAuthPending()
        setError(getErrorMessage(e, 'Google sign-in failed'))
      }
    })()
  }, [router, searchParams, signInWithGoogle, signInWithGoogleAuthCode])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-8">
      <AppLogo href="" />
      {error ? (
        <>
          <p className="max-w-sm text-center text-sm text-gray-600">{error}</p>
          <button
            type="button"
            className="text-sm font-semibold text-brand-green underline"
            onClick={() => router.replace('/login')}
          >
            Back to login
          </button>
        </>
      ) : (
        <p className="text-sm text-gray-600">Redirecting to Google…</p>
      )}
    </main>
  )
}

export default function OAuthPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface">
          <p className="text-sm text-gray-500">Redirecting to Google…</p>
        </main>
      }
    >
      <GoogleOAuthCallback />
    </Suspense>
  )
}
