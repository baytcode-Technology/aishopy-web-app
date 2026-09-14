'use client'

import { getStoredThemeMode, setStoredThemeMode } from '@/platform/theme-storage'
import { getPaletteForMode, paletteToCssVars, type ThemeMode } from '@/theme/palette'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ThemeContextValue = {
  mode: ThemeMode
  isDark: boolean
  toggleTheme: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyCssVars(mode: ThemeMode) {
  const vars = paletteToCssVars(getPaletteForMode(mode))
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light')

  useEffect(() => {
    const stored = getStoredThemeMode()
    if (stored && stored !== 'light') {
      setModeState(stored)
      applyCssVars(stored)
    }
  }, [])

  const applyMode = useCallback((next: ThemeMode) => {
    setModeState(next)
    applyCssVars(next)
    setStoredThemeMode(next)
  }, [])

  const toggleTheme = useCallback(() => {
    applyMode(mode === 'light' ? 'dark' : 'light')
  }, [applyMode, mode])

  const setMode = useCallback(
    (next: ThemeMode) => {
      if (next !== mode) applyMode(next)
    },
    [applyMode, mode],
  )

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === 'dark',
      toggleTheme,
      setMode,
    }),
    [mode, setMode, toggleTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider')
  }
  return ctx
}
