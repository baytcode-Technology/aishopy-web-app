import type { ThemeMode } from '@/theme/palette'

const THEME_MODE_KEY = 'aishopy_theme_mode'

export function getStoredThemeMode(): ThemeMode | null {
  try {
    const raw = localStorage.getItem(THEME_MODE_KEY)
    if (raw === 'light' || raw === 'dark') return raw
  } catch {
    // ignore
  }
  return null
}

export function setStoredThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode)
  } catch {
    // ignore
  }
}
