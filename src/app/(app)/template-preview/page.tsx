'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { env } from '@/core/config/env'
import type { ThemeTemplate } from '@/core/types/store'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo } from 'react'

const DEFAULT_PRIMARY = '#2DB84C'

function buildPreviewUrl(template: string, primary: string, mode: string): string {
  const base = env.storefrontPreviewBaseUrl.replace(/\/$/, '')
  const params = new URLSearchParams()
  params.set('template', template)
  params.set('primary', primary)
  params.set('mode', mode)
  return `${base}/preview/storefront?${params.toString()}`
}

function TemplatePreviewBody() {
  const router = useRouter()
  const params = useSearchParams()

  const template = (params.get('template') as ThemeTemplate) || 'classic'
  const rawPrimary = params.get('primary') ?? ''
  const primary = /^#[0-9A-Fa-f]{6}$/.test(rawPrimary) ? rawPrimary : DEFAULT_PRIMARY
  const rawMode = params.get('mode')
  const mode = rawMode === 'dark' || rawMode === 'extra-dark' ? 'dark' : 'light'

  const previewUrl = useMemo(
    () => buildPreviewUrl(template, primary, mode),
    [template, primary, mode],
  )

  return (
    <main className="flex min-h-full flex-col bg-gray-100">
      <CatalogHeader
        title="Demo preview"
        subtitle="Sample products — orders are not placed"
        onBack={() => router.back()}
        showSettings={false}
      />
      <div className="min-h-0 flex-1 border-t border-gray-200 bg-white">
        <iframe title="Storefront demo preview" src={previewUrl} className="h-[calc(100vh-220px)] min-h-[480px] w-full border-0" />
      </div>
      <div className="border-t border-gray-200 bg-surface px-4 pb-4 pt-3 shadow-sm">
        <p className="mb-2 text-center text-[13px] font-bold tracking-wide text-gray-500">
          Browsing {template} template with your selected colors
        </p>
        <Button label="Close preview" variant="outline" onClick={() => router.back()} />
      </div>
    </main>
  )
}

export default function TemplatePreviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-full items-center justify-center bg-gray-100">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
        </main>
      }
    >
      <TemplatePreviewBody />
    </Suspense>
  )
}
