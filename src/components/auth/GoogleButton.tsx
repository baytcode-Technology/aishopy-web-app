'use client'

import { GoogleIcon } from '@/components/auth/GoogleIcon'
import { env } from '@/core/config/env'
import { startGoogleOAuth } from '@/core/lib/google-oauth'

export function GoogleButton() {
  if (!env.googleWebClientId) return null

  return (
    <button
      type="button"
      onClick={() => void startGoogleOAuth()}
      className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-[15px] font-semibold text-ink hover:bg-gray-100"
    >
      <GoogleIcon />
      Continue with Google
    </button>
  )
}
