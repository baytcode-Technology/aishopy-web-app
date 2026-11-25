import type { InstagramConnectionStatus } from '@/core/api/instagram-connect'
import {
  broadcastOAuth,
  clearOAuthStoreId,
  loadOAuthStoreId,
  openAuthPopup,
  persistOAuthStoreId,
} from '@/core/lib/oauth-popup'

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

export function persistInstagramOAuthStoreId(storeId: number): void {
  persistOAuthStoreId(INSTAGRAM_OAUTH_STORE_KEY, storeId)
}

export function loadInstagramOAuthStoreId(): number | null {
  return loadOAuthStoreId(INSTAGRAM_OAUTH_STORE_KEY)
}

export function clearInstagramOAuthStoreId(): void {
  clearOAuthStoreId(INSTAGRAM_OAUTH_STORE_KEY)
}

export function broadcastInstagramOAuth(payload: InstagramOAuthMessage): void {
  broadcastOAuth(INSTAGRAM_OAUTH_CHANNEL, payload)
}

export function openInstagramAuthSession(input: {
  connectUrl: string
  pollStatus?: () => Promise<InstagramConnectionStatus | null>
}): Promise<InstagramAuthSessionResult | InstagramAuthSessionError> {
  const dismissed = { type: 'dismissed' } as const

  return openAuthPopup<InstagramAuthSessionResult | InstagramAuthSessionError>({
    url: input.connectUrl,
    windowName: 'aishopy-instagram-oauth',
    channelName: INSTAGRAM_OAUTH_CHANNEL,
    blockedResult: dismissed,
    tickMs: 1500,
    onMessage: (raw, finish) => {
      const data = raw as InstagramOAuthMessage | null
      if (!data) return
      if (data.error) {
        finish({ type: 'error', message: data.error })
        return
      }
      if (data.connected) {
        finish({ connected: true, username: data.username ?? null })
      }
    },
    onTick: (popup, finish) => {
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
          finish(dismissed)
        }
      })()
    },
  })
}
