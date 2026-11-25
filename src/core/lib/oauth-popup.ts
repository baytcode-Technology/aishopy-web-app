export function popupFeatures(): string {
  const width = 520
  const height = 720
  const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2))
  const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2))
  return `popup=yes,width=${width},height=${height},left=${left},top=${top},noopener=no`
}

export function persistOAuthStoreId(storageKey: string, storeId: number): void {
  sessionStorage.setItem(storageKey, String(storeId))
}

export function loadOAuthStoreId(storageKey: string): number | null {
  const raw = sessionStorage.getItem(storageKey)
  if (!raw) return null
  const id = Number(raw)
  return Number.isFinite(id) ? id : null
}

export function clearOAuthStoreId(storageKey: string): void {
  sessionStorage.removeItem(storageKey)
}

export function broadcastOAuth(channelName: string, payload: unknown): void {
  try {
    const channel = new BroadcastChannel(channelName)
    channel.postMessage(payload)
    channel.close()
  } catch {
    // BroadcastChannel unavailable
  }
}

export function openAuthPopup<T>(input: {
  url: string
  windowName: string
  channelName: string
  blockedResult: T
  tickMs: number
  giveUpMs?: number
  giveUpResult?: T
  onMessage: (data: unknown, finish: (result: T) => void) => void
  onTick: (popup: Window, finish: (result: T) => void) => void
}): Promise<T> {
  const popup = window.open(input.url, input.windowName, popupFeatures())
  if (!popup) {
    window.location.assign(input.url)
    return Promise.resolve(input.blockedResult)
  }

  return new Promise((resolve) => {
    let settled = false
    let timer = 0
    let giveUp = 0
    const channel = new BroadcastChannel(input.channelName)

    const finish = (result: T) => {
      if (settled) return
      settled = true
      window.clearInterval(timer)
      if (giveUp) window.clearTimeout(giveUp)
      channel.close()
      try {
        popup.close()
      } catch {
        // already closed
      }
      resolve(result)
    }

    channel.onmessage = (event: MessageEvent) => {
      input.onMessage(event.data, finish)
    }

    timer = window.setInterval(() => {
      input.onTick(popup, finish)
    }, input.tickMs)

    if (input.giveUpMs != null && input.giveUpResult !== undefined) {
      giveUp = window.setTimeout(() => {
        if (!settled) finish(input.giveUpResult as T)
      }, input.giveUpMs)
    }
  })
}
