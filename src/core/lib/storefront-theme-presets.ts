export type ThemeMode = 'light' | 'dark'

export type ThemePreset = {
  id: string
  label: string
  primary: string
  hint: string
}

export const LIGHT_SURFACE = { background: '#FFFFFF', text: '#1A1A1A' } as const
export const DARK_SURFACE = { background: '#000000', text: '#FAFAFA' } as const
/** Old flat dark surface — treated as Dark for stores saved before the rename. */
const LEGACY_FLAT_DARK_BACKGROUND = '#111111'

export const DEFAULT_PRIMARY = '#2DB84C'

/** Contrast-tested accents on white background + dark body text. */
export const LIGHT_THEME_PRESETS: ThemePreset[] = [
  { id: 'forest', label: 'Forest', primary: '#2DB84C', hint: 'Green on white' },
  { id: 'ocean', label: 'Ocean', primary: '#2563EB', hint: 'Blue on white' },
  { id: 'teal', label: 'Teal', primary: '#0D9488', hint: 'Teal on white' },
  { id: 'violet', label: 'Violet', primary: '#7C3AED', hint: 'Purple on white' },
]

/** Bright accents that stay readable on Dark + light text. */
export const DARK_THEME_PRESETS: ThemePreset[] = [
  { id: 'mint', label: 'Mint', primary: '#4ADE80', hint: 'Green on dark' },
  { id: 'sky', label: 'Sky', primary: '#60A5FA', hint: 'Blue on dark' },
]

/** Maps light preset ids to their dark-mode counterpart when switching themes. */
const LIGHT_TO_DARK_ID: Record<string, string> = {
  forest: 'mint',
  ocean: 'sky',
  teal: 'mint',
  violet: 'sky',
}

/** Maps dark preset ids back to a light-mode counterpart. */
const DARK_TO_LIGHT_ID: Record<string, string> = {
  mint: 'forest',
  sky: 'ocean',
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export function isValidThemeHex(value: string): boolean {
  return HEX_RE.test(value)
}

export function presetsForMode(mode: ThemeMode): ThemePreset[] {
  return mode === 'light' ? LIGHT_THEME_PRESETS : DARK_THEME_PRESETS
}

export function getSurfaceColors(mode: ThemeMode) {
  return mode === 'dark' ? DARK_SURFACE : LIGHT_SURFACE
}

export function findPresetByPrimary(primary: string, mode: ThemeMode): ThemePreset | undefined {
  const upper = primary.toUpperCase()
  return presetsForMode(mode).find((preset) => preset.primary.toUpperCase() === upper)
}

export function snapPrimaryToMode(primary: string, mode: ThemeMode): string {
  const match = findPresetByPrimary(primary, mode)
  if (match) return match.primary
  return presetsForMode(mode)[0].primary
}

export function mapPrimaryAcrossModes(
  primary: string,
  fromMode: ThemeMode,
  toMode: ThemeMode,
): string {
  if (fromMode === toMode) return snapPrimaryToMode(primary, toMode)

  const current = findPresetByPrimary(primary, fromMode)
  const targetPresets = presetsForMode(toMode)

  if (current) {
    const mappedId = fromMode === 'light' ? LIGHT_TO_DARK_ID[current.id] : DARK_TO_LIGHT_ID[current.id]
    const mapped = targetPresets.find((preset) => preset.id === mappedId)
    if (mapped) return mapped.primary
  }

  return targetPresets[0].primary
}

export function getThemeMode(background?: string | null): ThemeMode {
  const normalized = background?.toUpperCase()
  if (
    normalized === DARK_SURFACE.background.toUpperCase() ||
    normalized === LEGACY_FLAT_DARK_BACKGROUND
  ) {
    return 'dark'
  }
  return 'light'
}
