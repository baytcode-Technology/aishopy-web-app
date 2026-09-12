'use client'

import { HeaderOverflow } from '@/components/catalog/HeaderOverflow'
import { AppLogo } from '@/components/brand/AppLogo'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  right?: ReactNode
  onBack?: () => void
  backHref?: string
}

export function CatalogHeader({ title, subtitle, right, onBack, backHref }: Props) {
  return (
    <header className="bg-surface px-5 pb-3 pt-1">
      <div className="mb-2 hidden justify-center max-lg:flex">
        <AppLogo href="" />
      </div>
      <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pr-3">
            {onBack || backHref ? (
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
            <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            {subtitle ? (
              <p className="mt-1.5 text-[14px] font-medium leading-5 text-gray-500">{subtitle}</p>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {right}
            <HeaderOverflow />
          </div>
      </div>
    </header>
  )
}
