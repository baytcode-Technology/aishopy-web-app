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

function popupFeatures(): string {
  const width = 520
  const height = 720
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener=no`
}

export function persistWhatsAppOAuthStoreId(storeId: number): void {
  sessionStorage.setItem(WHATSAPP_OAUTH_STORE_KEY, String(storeId))
}

export function loadWhatsAppOAuthStoreId(): number | null {
  const raw = sessionStorage.getItem(WHATSAPP_OAUTH_STORE_KEY)
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export function clearWhatsAppOAuthStoreId(): void {
  sessionStorage.removeItem(WHATSAPP_OAUTH_STORE_KEY)
}

export function broadcastWhatsAppOAuth(payload: WhatsAppOAuthMessage): void {
  try {
    const channel = new BroadcastChannel(WHATSAPP_OAUTH_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel unavailable
  }
}

export async function openWhatsAppEmbeddedSignupAuthSession(input: {
  signupUrl: string
  redirectUri?: string
}): Promise<WhatsAppAuthSessionResult | WhatsAppAuthSessionError> {
  const popup = window.open(input.signupUrl, 'aishopy-whatsapp-oauth', popupFeatures())
  if (!popup) {
    window.location.assign(input.signupUrl)
    return { type: 'dismissed' }
  }

  return new Promise((resolve) => {
    let settled = false
    const channel = new BroadcastChannel(WHATSAPP_OAUTH_CHANNEL)

    const finish = (result: WhatsAppAuthSessionResult | WhatsAppAuthSessionError) => {
      if (settled) return
      settled = true
      window.clearInterval(timer)
      channel.close()
      try {
        popup.close()
      } catch {
        // already closed
      }
      resolve(result)
    }

    channel.onmessage = (event: MessageEvent<WhatsAppOAuthMessage>) => {
      const data = event.data
      if (!data) return
      if (data.error) {
        finish({ type: 'error', message: data.error })
        return
      }
      if (data.code) {
        finish({ code: data.code, state: data.state ?? null })
      }
    }

    const timer = window.setInterval(() => {
      if (popup.closed) {
        finish({ type: 'dismissed' })
      }
    }, 400)

    window.setTimeout(() => {
      if (!settled && popup.closed) finish({ type: 'dismissed' })
    }, 10 * 60 * 1000)
  })
}
