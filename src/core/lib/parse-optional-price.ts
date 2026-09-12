export function parseOptionalPrice(value: string): number | null | undefined {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}
