'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { StorefrontUrlActions } from '@/components/store/StorefrontUrlActions'
import { Button } from '@/components/ui/Button'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { updateMyStore } from '@/core/api/stores'
import { env } from '@/core/config/env'
import { getErrorMessage } from '@/core/lib/api-error'
import { buildSubdomainUrl } from '@/core/lib/storefront'
import {
  DARK_SURFACE,
  DEFAULT_PRIMARY,
  getSurfaceColors,
  getThemeMode,
  isValidThemeHex,
  LIGHT_SURFACE,
  mapPrimaryAcrossModes,
  presetsForMode,
  snapPrimaryToMode,
  type ThemeMode,
  type ThemePreset,
} from '@/core/lib/storefront-theme-presets'
import type { Store, ThemeConfig, ThemeTemplate } from '@/core/types/store'
import { useAppTheme } from '@/providers/theme-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

const TEMPLATES: {
  id: ThemeTemplate
  name: string
  tagline: string
}[] = [
  { id: 'classic', name: 'Classic', tagline: 'Search & filter · product grid' },
  { id: 'boutique', name: 'Marketplace', tagline: 'Category sidebar · dense grid' },
  { id: 'modern', name: 'Modern', tagline: 'Sticky nav · clean checkout' },
]

function normalizeTheme(raw: Store['theme_config']): ThemeConfig {
  const template: ThemeTemplate =
    raw?.template === 'boutique' || raw?.template === 'modern' ? raw.template : 'classic'
  const mode = getThemeMode(raw?.colors?.background)
  const primaryRaw =
    raw?.colors?.primary && isValidThemeHex(raw.colors.primary)
      ? raw.colors.primary.toUpperCase()
      : DEFAULT_PRIMARY
  const primary = snapPrimaryToMode(primaryRaw, mode)
  return {
    template,
    colors: { primary, ...getSurfaceColors(mode) },
  }
}

function DummyImage({ size = 28, tint }: { size?: number; tint?: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{
        width: size + 16,
        height: size + 16,
        backgroundColor: tint ? `${tint}22` : '#E8E8EC',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%]"
        fill={tint ?? '#9CA3AF'}
        aria-hidden
      >
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2ZM8.5 11.5A1.5 1.5 0 1 1 8.5 8.5a1.5 1.5 0 0 1 0 3ZM5 17l4.5-6 3.5 4.5 2.5-3L19 17H5Z" />
      </svg>
    </div>
  )
}

function CartIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={color} aria-hidden>
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM7.2 6h13.3l-1.4 7.2a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.2 4H2V2h4.2l.8 4Z" />
    </svg>
  )
}

function TemplateMockPreview({
  variant,
  accent,
  isDark,
}: {
  variant: ThemeTemplate
  accent: string
  isDark: boolean
}) {
  if (variant === 'boutique') {
    return (
      <div className={`w-full overflow-hidden rounded-t-2xl ${isDark ? 'bg-gray-100' : 'bg-[#F3F4F6]'}`}>
        <div
          className={`flex items-center justify-between border-b border-gray-200 px-3 py-2.5 ${
            isDark ? 'bg-surface' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full" style={{ backgroundColor: accent }} />
            <div className="h-2.5 w-16 rounded-full bg-gray-300" />
          </div>
          <CartIcon color={accent} />
        </div>
        <div className="flex gap-2 px-3 py-3">
          <div className="w-14 gap-1.5 pt-1">
            <div className="mb-1.5 h-2 w-full rounded-full" style={{ backgroundColor: accent }} />
            <div className="mb-1.5 h-2 w-full rounded-full bg-gray-300" />
            <div className="mb-1.5 h-2 w-3/4 rounded-full bg-gray-300" />
            <div className="h-2 w-full rounded-full bg-gray-300" />
          </div>
          <div className="flex flex-1 flex-wrap gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex w-[47%] flex-col items-center rounded-xl border border-gray-200 py-3 ${
                  isDark ? 'bg-surface' : 'bg-white'
                }`}
              >
                <DummyImage size={28} tint={accent} />
                <div className="mt-1.5 h-1.5 w-10 rounded-full bg-gray-300" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'modern') {
    return (
      <div className={`w-full overflow-hidden rounded-t-2xl ${isDark ? 'bg-gray-100' : 'bg-[#F3F4F6]'}`}>
        <div
          className={`flex items-center justify-between border-b border-gray-200 px-3 py-2.5 ${
            isDark ? 'bg-surface' : 'bg-white'
          }`}
        >
          <div className="h-2.5 w-20 rounded-full bg-gray-800" />
          <CartIcon color={accent} />
        </div>
        <div
          className={`flex gap-2 border-b border-gray-100 px-3 py-2.5 ${isDark ? 'bg-surface' : 'bg-white'}`}
        >
          <div
            className="flex h-7 items-center justify-center rounded-full px-3"
            style={{ backgroundColor: accent }}
          >
            <div className="h-1.5 w-8 rounded-full bg-white/90" />
          </div>
          <div className="flex h-7 items-center justify-center rounded-full bg-gray-100 px-3">
            <div className="h-1.5 w-8 rounded-full bg-gray-400" />
          </div>
          <div className="flex h-7 items-center justify-center rounded-full bg-gray-100 px-3">
            <div className="h-1.5 w-8 rounded-full bg-gray-400" />
          </div>
        </div>
        <div className="flex gap-2 px-3 py-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex flex-1 flex-col items-center rounded-xl border border-gray-200 py-3 ${
                isDark ? 'bg-surface' : 'bg-white'
              }`}
            >
              <DummyImage size={32} tint={accent} />
              <div className="mt-2 h-1.5 w-10 rounded-full bg-gray-300" />
              <div className="mt-1 h-1.5 w-6 rounded-full" style={{ backgroundColor: accent }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full overflow-hidden rounded-t-2xl ${isDark ? 'bg-gray-100' : 'bg-[#F3F4F6]'}`}>
      <div
        className="flex items-center justify-between border-b border-gray-200 px-3 py-2.5"
        style={{ backgroundColor: isDark ? '#141416' : undefined }}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-2.5 w-16 rounded-full bg-gray-300" />
        </div>
        <CartIcon color={accent} />
      </div>
      <div className="mx-3 mt-3 flex items-center gap-2">
        <div
          className={`h-9 w-9 rounded-lg border border-gray-200 ${isDark ? 'bg-surface' : 'bg-white'}`}
        />
        <div
          className={`h-9 flex-1 rounded-full border border-gray-200 ${isDark ? 'bg-surface' : 'bg-white'}`}
        />
      </div>
      <div className="flex flex-wrap gap-2 px-3 py-3 pb-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex w-[47%] flex-col items-center rounded-xl border border-gray-200 py-3 ${
              isDark ? 'bg-surface' : 'bg-white'
            }`}
          >
            <DummyImage size={28} tint={accent} />
            <div className="mt-1.5 h-1.5 w-10 rounded-full bg-gray-300" />
          </div>
        ))}
      </div>
    </div>
  )
}

function TemplateCard({
  name,
  tagline,
  selected,
  accent,
  variant,
  onSelect,
  onPreview,
  isDark,
}: {
  name: string
  tagline: string
  selected: boolean
  accent: string
  variant: ThemeTemplate
  onSelect: () => void
  onPreview: () => void
  isDark: boolean
}) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl border-2 shadow-sm ${
        isDark ? 'bg-surface' : 'bg-white'
      } ${selected ? '' : 'border-gray-200'}`}
      style={selected ? { borderColor: accent } : undefined}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${name} template`}
        className="w-full"
      >
        <TemplateMockPreview variant={variant} accent={accent} isDark={isDark} />
      </button>

      <div
        className={`flex items-center justify-between gap-3 border-t border-gray-100 px-4 py-3.5 ${
          isDark ? 'bg-surface' : 'bg-white'
        }`}
      >
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className="text-[17px] font-bold" style={{ color: accent }}>
            {name}
          </p>
          <p className="mt-0.5 text-[12px] text-gray-500">{tagline}</p>
          {selected ? (
            <p className="mt-1 text-[11px] font-semibold" style={{ color: accent }}>
              Selected
            </p>
          ) : null}
        </button>

        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${name} demo`}
          className={`rounded-xl border border-gray-300 px-4 py-2.5 ${isDark ? 'bg-surface' : 'bg-white'}`}
        >
          <span className="text-[14px] font-semibold text-ink">Preview</span>
        </button>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-gray-200 bg-surface p-5 shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle ? <p className="text-[13px] leading-5 text-gray-500">{subtitle}</p> : null}
      </div>
      {children}
    </div>
  )
}

function ColorCombinationCard({
  preset,
  mode,
  selected,
  onSelect,
  isDark,
}: {
  preset: ThemePreset
  mode: ThemeMode
  selected: boolean
  onSelect: () => void
  isDark: boolean
}) {
  const surface = getSurfaceColors(mode)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${preset.label} — ${preset.hint}`}
      className="w-[48%] self-auto text-left"
    >
      <div
        className={`overflow-hidden rounded-2xl border-2 ${selected ? 'border-ink' : 'border-gray-200'}`}
        style={{ minHeight: 132 }}
      >
        <div
          className="flex min-h-[88px] flex-1 flex-col justify-between px-3 py-3"
          style={{ backgroundColor: surface.background }}
        >
          <p className="text-[13px] font-semibold" style={{ color: surface.text }}>
            Product name
          </p>
          <div className="flex items-center justify-between">
            <p className="text-[11px]" style={{ color: surface.text, opacity: 0.65 }}>
              ₹499
            </p>
            <span className="rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: preset.primary }}>
              Buy
            </span>
          </div>
        </div>
        <div
          className={`flex items-center justify-between border-t px-3 py-2.5 ${
            selected
              ? isDark
                ? 'border-gray-200 bg-gray-50'
                : 'border-ink/10 bg-gray-50'
              : isDark
                ? 'border-gray-200 bg-surface'
                : 'border-gray-100 bg-white'
          }`}
        >
          <div className="min-w-0 flex-1 pr-2">
            <p className="text-[13px] font-semibold text-ink">{preset.label}</p>
            <p className="text-[11px] text-gray-500">{preset.hint}</p>
          </div>
          {selected ? (
            <span style={{ color: preset.primary }}>
              <MenuIcon name="check-circle" className="h-[18px] w-[18px]" />
            </span>
          ) : (
            <div
              className="h-4 w-4 rounded-full border border-gray-300"
              style={{ backgroundColor: preset.primary }}
            />
          )}
        </div>
      </div>
    </button>
  )
}

function ModeToggle({
  mode,
  onChange,
  isDark,
}: {
  mode: ThemeMode
  onChange: (next: ThemeMode) => void
  isDark: boolean
}) {
  return (
    <div className="flex gap-3">
      {(
        [
          {
            key: 'light' as const,
            label: 'Light',
            bg: LIGHT_SURFACE.background,
            fg: LIGHT_SURFACE.text,
            hint: 'White background',
          },
          {
            key: 'dark' as const,
            label: 'Dark',
            bg: DARK_SURFACE.background,
            fg: DARK_SURFACE.text,
            hint: 'Pure black + glass',
          },
        ] as const
      ).map((opt) => {
        const selected = mode === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            aria-pressed={selected}
            className="min-w-0 flex-1"
          >
            <div className={`overflow-hidden rounded-2xl border-2 ${selected ? 'border-ink' : 'border-gray-200'}`}>
              <div className="flex h-16 flex-col items-center justify-center px-3" style={{ backgroundColor: opt.bg }}>
                <p className="text-[15px] font-bold" style={{ color: opt.fg }}>
                  Aa
                </p>
                <p className="mt-1 text-[11px]" style={{ color: opt.fg, opacity: 0.7 }}>
                  Sample text
                </p>
              </div>
              <div
                className={`flex items-center justify-center gap-2 py-2.5 ${selected ? 'bg-ink' : 'bg-gray-50'}`}
              >
                <div
                  className="h-3 w-3 rounded-full border border-gray-300"
                  style={{ backgroundColor: opt.bg }}
                />
                <p
                  className={`text-[13px] font-bold ${
                    selected ? (isDark ? 'text-charcoal' : 'text-white') : 'text-gray-600'
                  }`}
                >
                  {opt.label}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function WebsiteCustomizePage() {
  const router = useRouter()
  const { store, role, subdomainUrl, activateStoreSession, refreshStore } = useStore()
  const { isDark } = useAppTheme()

  const [template, setTemplate] = useState<ThemeTemplate>('classic')
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY)
  const [mode, setMode] = useState<ThemeMode>('light')
  const [initialConfig, setInitialConfig] = useState<ThemeConfig | null>(null)
  const [initializedStoreId, setInitializedStoreId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!store || store.id === initializedStoreId) return
    const normalized = normalizeTheme(store.theme_config)
    setTemplate(normalized.template)
    setPrimary(normalized.colors.primary)
    setMode(getThemeMode(normalized.colors.background))
    setInitialConfig(normalized)
    setInitializedStoreId(store.id)
  }, [store, initializedStoreId])

  const colorPresets = useMemo(() => presetsForMode(mode), [mode])

  const currentConfig: ThemeConfig = useMemo(
    () => ({
      template,
      colors: { primary, ...getSurfaceColors(mode) },
    }),
    [template, primary, mode],
  )

  const dirty = initialConfig != null && JSON.stringify(currentConfig) !== JSON.stringify(initialConfig)

  const selectSwatch = (color: string) => {
    setPrimary(snapPrimaryToMode(color, mode))
  }

  const handleModeChange = (next: ThemeMode) => {
    const nextPrimary = mapPrimaryAcrossModes(primary, mode, next)
    setMode(next)
    setPrimary(nextPrimary)
  }

  const handleSave = async () => {
    if (!store || saving) return
    setSaving(true)
    setError(null)
    try {
      const res = await updateMyStore(store.id, { theme_config: currentConfig })
      const updated = res.data.store
      const url = subdomainUrl ?? buildSubdomainUrl(updated.slug)
      await activateStoreSession(updated, url, role ?? 'owner')
      await refreshStore()
      setInitialConfig(currentConfig)
      setNotice('Website updated — Changes are live on your storefront')
    } catch (e) {
      setError(getErrorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const openPreview = (previewTemplate: ThemeTemplate) => {
    const params = new URLSearchParams({
      template: previewTemplate,
      primary,
      mode,
    })
    router.push(`/template-preview?${params.toString()}`)
  }

  const storefrontHost = store?.slug ? `${store.slug}.${env.storefrontBaseDomain}` : null
  const storefrontUrl = subdomainUrl ?? (store?.slug ? buildSubdomainUrl(store.slug) : null)

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Website"
        subtitle="Design & customization"
        onBack={() => router.back()}
        showSettings={false}
      />
      <div className="flex flex-col gap-5 px-5 pb-12 pt-2">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        <SectionCard
          title="Templates"
          subtitle="Pick a full storefront layout. Tap Preview to try a demo store."
        >
          <div className="flex flex-col gap-4">
            {TEMPLATES.map((item) => (
              <TemplateCard
                key={item.id}
                name={item.name}
                tagline={item.tagline}
                variant={item.id}
                selected={template === item.id}
                accent={primary}
                onSelect={() => setTemplate(item.id)}
                onPreview={() => openPreview(item.id)}
                isDark={isDark}
              />
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Colors"
          subtitle="Background and text are fixed per theme. Pick a tested accent for your storefront."
        >
          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold tracking-wide text-gray-600">Background & text</p>
            <ModeToggle mode={mode} onChange={handleModeChange} isDark={isDark} />
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[13px] font-bold tracking-wide text-gray-600">Brand accent</p>
            <p className="text-[12px] leading-5 text-gray-500">
              {mode === 'light'
                ? 'White page, dark text — pick one of four accents'
                : 'Pure black glass page, light text — two readable accents'}
            </p>
            <div className="flex flex-wrap justify-between gap-y-3">
              {colorPresets.map((preset) => {
                const selected = primary.toUpperCase() === preset.primary.toUpperCase()
                return (
                  <ColorCombinationCard
                    key={preset.id}
                    preset={preset}
                    mode={mode}
                    selected={selected}
                    onSelect={() => selectSwatch(preset.primary)}
                    isDark={isDark}
                  />
                )
              })}
            </div>
          </div>
        </SectionCard>

        {storefrontHost && storefrontUrl ? (
          <SectionCard title="View website" subtitle="Open your live site to check the result.">
            <StorefrontUrlActions url={storefrontUrl} displayHost={storefrontHost} />
          </SectionCard>
        ) : null}

        <div className="pt-1">
          <Button
            label={dirty ? 'Save changes' : 'Saved'}
            loading={saving}
            disabled={!store || !dirty}
            onClick={() => void handleSave()}
          />
        </div>
      </div>
    </main>
  )
}
