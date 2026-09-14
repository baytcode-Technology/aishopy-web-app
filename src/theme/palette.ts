/** Raw hex tokens — light values are the current production look. */
export type Palette = {
  brandGreen: string
  ink: string
  charcoal: string
  surface: string
  gray50: string
  gray100: string
  gray200: string
  gray300: string
  gray400: string
  gray500: string
  gray600: string
  gray700: string
  success: string
  successBg: string
  successBorder: string
  danger: string
  dangerBg: string
  dangerBorder: string
  warning: string
  warningBg: string
  overlay: string
  inkSoft: string
  inkCounter: string
}

export const lightPalette: Palette = {
  brandGreen: '#3EB056',
  ink: '#0A0A0B',
  charcoal: '#141416',
  surface: '#FFFFFF',
  gray50: '#FAFAFA',
  gray100: '#F5F5F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  success: '#18181B',
  successBg: '#F4F4F5',
  successBorder: '#E4E4E7',
  danger: '#18181B',
  dangerBg: '#F4F4F5',
  dangerBorder: '#E4E4E7',
  warning: '#52525B',
  warningBg: '#F4F4F5',
  overlay: 'rgba(10,10,11,0.45)',
  inkSoft: 'rgba(10,10,11,0.55)',
  inkCounter: 'rgba(10,10,11,0.65)',
}

export const darkPalette: Palette = {
  brandGreen: '#3EB056',
  ink: '#FAFAFA',
  charcoal: '#0A0A0B',
  surface: '#141416',
  gray50: '#18181B',
  gray100: '#0F0F10',
  gray200: '#27272A',
  gray300: '#3F3F46',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#D4D4D8',
  gray700: '#E4E4E7',
  success: '#FAFAFA',
  successBg: '#27272A',
  successBorder: '#3F3F46',
  danger: '#FAFAFA',
  dangerBg: '#27272A',
  dangerBorder: '#3F3F46',
  warning: '#D4D4D8',
  warningBg: '#27272A',
  overlay: 'rgba(0,0,0,0.65)',
  inkSoft: 'rgba(250,250,250,0.55)',
  inkCounter: 'rgba(250,250,250,0.65)',
}

export const palette = lightPalette

export type ThemeMode = 'light' | 'dark'

export function getPaletteForMode(mode: ThemeMode): Palette {
  return mode === 'dark' ? darkPalette : lightPalette
}

export function paletteToCssVars(p: Palette): Record<string, string> {
  return {
    '--color-ink': p.ink,
    '--color-ink-overlay': p.overlay,
    '--color-ink-soft': p.inkSoft,
    '--color-ink-counter': p.inkCounter,
    '--color-charcoal': p.charcoal,
    '--color-surface': p.surface,
    '--color-gray-50': p.gray50,
    '--color-gray-100': p.gray100,
    '--color-gray-200': p.gray200,
    '--color-gray-300': p.gray300,
    '--color-gray-400': p.gray400,
    '--color-gray-500': p.gray500,
    '--color-gray-600': p.gray600,
    '--color-gray-700': p.gray700,
    '--color-success': p.success,
    '--color-success-bg': p.successBg,
    '--color-success-border': p.successBorder,
    '--color-danger': p.danger,
    '--color-danger-bg': p.dangerBg,
    '--color-danger-border': p.dangerBorder,
    '--color-warning': p.warning,
    '--color-warning-bg': p.warningBg,
    '--color-brand-primary': p.ink,
    '--color-brand-green': p.brandGreen,
    '--color-brand-on-primary': p.surface,
  }
}
