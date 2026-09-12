type JwtPayload = {
  email?: string
  exp?: number
}

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const segment = token.split('.')[1]
    if (!segment) return null
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/')
    const pad = normalized.length % 4
    const padded = pad ? normalized + '='.repeat(4 - pad) : normalized
    if (typeof globalThis.atob !== 'function') return null
    const json = globalThis.atob(padded)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function emailFromAccessToken(token: string): string | undefined {
  const payload = parseJwtPayload(token)
  return typeof payload?.email === 'string' ? payload.email : undefined
}

export function expFromAccessToken(token: string): number | undefined {
  const payload = parseJwtPayload(token)
  return typeof payload?.exp === 'number' ? payload.exp : undefined
}
