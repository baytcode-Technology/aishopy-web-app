export function isAiPaused(aiPausedUntil: string | null | undefined): boolean {
  if (!aiPausedUntil) return false
  return new Date(aiPausedUntil).getTime() > Date.now()
}
