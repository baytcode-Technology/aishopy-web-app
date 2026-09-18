'use client'

import { HeaderOverflow } from '@/components/catalog/HeaderOverflow'
import { SettingsHeaderButton } from '@/components/catalog/SettingsHeaderButton'
import { AppLogo } from '@/components/brand/AppLogo'
import { Heading, Subtitle } from '@/components/ui/Typography'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
  backHref?: string
  showSettings?: boolean
}

export function CatalogHeader({
  title,
  subtitle,
  right,
  onBack,
  backHref,
  showSettings = true,
}: Props) {
  const showBack = Boolean(onBack || backHref)

  return (
    <header className="bg-surface px-5 pb-3 pt-1">
      <div className="relative">
        {!showBack ? (
          <div className="pointer-events-none absolute left-0 right-0 top-0 hidden justify-center max-lg:flex">
            <AppLogo href="" />
          </div>
        ) : null}
        <div
          className={`flex items-start justify-between gap-3 ${!showBack ? 'max-lg:mt-5' : ''}`}
        >
          <div className="min-w-0 flex-1 pr-3">
            {showBack ? (
              backHref ? (
                <Link
                  href={backHref}
                  className="mb-2 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-gray-500"
                >
                  ← Back
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-2 inline-flex items-center gap-1.5 py-1 text-[13px] font-semibold text-gray-500"
                >
                  ← Back
                </button>
              )
            ) : null}
            <Heading as="h1">{title}</Heading>
            {subtitle ? <Subtitle className="mt-1.5">{subtitle}</Subtitle> : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {right}
            {showSettings ? <SettingsHeaderButton /> : null}
            <HeaderOverflow />
          </div>
        </div>
      </div>
    </header>
  )
}
