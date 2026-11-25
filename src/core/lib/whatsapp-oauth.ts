import {
  broadcastOAuth,
  clearOAuthStoreId,
  loadOAuthStoreId,
  openAuthPopup,
  persistOAuthStoreId,
} from '@/core/lib/oauth-popup'

/** Deep link prefix the mobile app listens for (must match backend oauth-callback redirect). */
export const WHATSAPP_APP_AUTH_REDIRECT_URI = 'aishopyapp://whatsapp-oauth'

export const WHATSAPP_OAUTH_CHANNEL = 'aishopy-whatsapp-oauth'
export const WHATSAPP_OAUTH_STORE_KEY = 'aishopy_whatsapp_oauth_store_id'

export type WhatsAppAuthSessionResult = {
  code: string
  state: string | null
}

export type WhatsAppAuthSessionError =
  | { type: 'cancelled' }
  | { type: 'dismissed' }
  | { type: 'error'; message: string }

export type WhatsAppOAuthMessage = {
  code?: string | null
  state?: string | null
  error?: string | null
}

export function parseOAuthCallbackUrl(url: string): {
  code: string | null
  error: string | null
  state: string | null
} {
  try {
    const parsed = new URL(url)
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''))
    const codeFromQuery = parsed.searchParams.get('code')
    const codeFromHash = hashParams.get('code')
    return {
      code: codeFromQuery ?? codeFromHash,
      error:
        parsed.searchParams.get('error') ??
        parsed.searchParams.get('error_reason') ??
        hashParams.get('error'),
      state: parsed.searchParams.get('state') ?? hashParams.get('state'),
    }
  } catch {
    return { code: null, error: null, state: null }
  }
}

export function persistWhatsAppOAuthStoreId(storeId: number): void {
  persistOAuthStoreId(WHATSAPP_OAUTH_STORE_KEY, storeId)
}

export function loadWhatsAppOAuthStoreId(): number | null {
  return loadOAuthStoreId(WHATSAPP_OAUTH_STORE_KEY)
}

export function clearWhatsAppOAuthStoreId(): void {
  clearOAuthStoreId(WHATSAPP_OAUTH_STORE_KEY)
}

export function broadcastWhatsAppOAuth(payload: WhatsAppOAuthMessage): void {
  broadcastOAuth(WHATSAPP_OAUTH_CHANNEL, payload)
}

export function openWhatsAppEmbeddedSignupAuthSession(input: {
  signupUrl: string
  redirectUri?: string
}): Promise<WhatsAppAuthSessionResult | WhatsAppAuthSessionError> {
  let sawOpen = false
  let closedAt: number | null = null
  const dismissed = { type: 'dismissed' } as const

  return openAuthPopup<WhatsAppAuthSessionResult | WhatsAppAuthSessionError>({
    url: input.signupUrl,
    windowName: 'aishopy-whatsapp-oauth',
    channelName: WHATSAPP_OAUTH_CHANNEL,
    blockedResult: dismissed,
    tickMs: 400,
    giveUpMs: 10 * 60 * 1000,
    giveUpResult: dismissed,
    onMessage: (raw, finish) => {
      const data = raw as WhatsAppOAuthMessage | null
      if (!data) return
      if (data.error) {
        finish({ type: 'error', message: data.error })
        return
      }
      if (data.code) {
        finish({ code: data.code, state: data.state ?? null })
      }
    },
    onTick: (popup, finish) => {
      let closed = false
      try {
        closed = popup.closed
      } catch {
        closed = true
      }
      if (!closed) {
        sawOpen = true
        closedAt = null
        return
      }
      // The API page can report this popup closed while Meta is still open.
      // Wait until it has actually been seen open, then give the return page time to send the code.
      if (!sawOpen) return
      if (closedAt == null) closedAt = Date.now()
      if (Date.now() - closedAt >= 3000) finish(dismissed)
    },
  })
}
