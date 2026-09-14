import type { InstagramConnectionStatus } from '@/core/api/instagram-connect'

export const INSTAGRAM_APP_AUTH_REDIRECT_URI = 'aishopyapp://instagram-oauth'
export const INSTAGRAM_OAUTH_CHANNEL = 'aishopy-instagram-oauth'
export const INSTAGRAM_OAUTH_STORE_KEY = 'aishopy_instagram_oauth_store_id'

export type InstagramAuthSessionResult = {
  connected: boolean
  username: string | null
}

export type InstagramAuthSessionError =
  | { type: 'cancelled' }
  | { type: 'dismissed' }
  | { type: 'error'; message: string }

export type InstagramOAuthMessage = {
  connected?: boolean
  username?: string | null
  error?: string | null
}

export function parseInstagramOAuthRedirectParams(params: {
  get(name: string): string | null
}): {
  connected: boolean
  username: string | null
  error: string | null
} {
  const error = params.get('error')
  const connected = params.get('connected') === '1'
  const username = params.get('username')
  return { connected, username, error }
}

function popupFeatures(): string {
  const width = 520
  const height = 720
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener=no`
}

export function persistInstagramOAuthStoreId(storeId: number): void {
  sessionStorage.setItem(INSTAGRAM_OAUTH_STORE_KEY, String(storeId))
}

export function loadInstagramOAuthStoreId(): number | null {
  const raw = sessionStorage.getItem(INSTAGRAM_OAUTH_STORE_KEY)
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export function clearInstagramOAuthStoreId(): void {
  sessionStorage.removeItem(INSTAGRAM_OAUTH_STORE_KEY)
}

export function broadcastInstagramOAuth(payload: InstagramOAuthMessage): void {
  try {
    const channel = new BroadcastChannel(INSTAGRAM_OAUTH_CHANNEL)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel unavailable
  }
}

export async function openInstagramAuthSession(input: {
  connectUrl: string
  pollStatus?: () => Promise<InstagramConnectionStatus | null>
}): Promise<InstagramAuthSessionResult | InstagramAuthSessionError> {
  const popup = window.open(input.connectUrl, 'aishopy-instagram-oauth', popupFeatures())
  if (!popup) {
    window.location.assign(input.connectUrl)
    return { type: 'dismissed' }
  }

  return new Promise((resolve) => {
    let settled = false
    const channel = new BroadcastChannel(INSTAGRAM_OAUTH_CHANNEL)

    const finish = (result: InstagramAuthSessionResult | InstagramAuthSessionError) => {
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

    channel.onmessage = (event: MessageEvent<InstagramOAuthMessage>) => {
      const data = event.data
      if (!data) return
      if (data.error) {
        finish({ type: 'error', message: data.error })
        return
      }
      if (data.connected) {
        finish({ connected: true, username: data.username ?? null })
      }
    }

    const timer = window.setInterval(() => {
      void (async () => {
        if (input.pollStatus) {
          try {
            const status = await input.pollStatus()
            if (status?.connected) {
              finish({
                connected: true,
                username: status.ig_username,
              })
              return
            }
          } catch {
            // keep waiting
          }
        }

        if (popup.closed) {
          if (input.pollStatus) {
            try {
              const status = await input.pollStatus()
              if (status?.connected) {
                finish({ connected: true, username: status.ig_username })
                return
              }
            } catch {
              // fall through
            }
          }
          finish({ type: 'dismissed' })
        }
      })()
    }, 1500)
  })
}
