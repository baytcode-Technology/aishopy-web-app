'use client'

import { HeaderOverflow } from '@/components/catalog/HeaderOverflow'
import Link from 'next/link'
import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  backHref: string
  right?: ReactNode
}

export function DetailHeader({ title, backHref, right }: Props) {
  return (
    <header className="flex items-center border-b border-gray-100 bg-surface px-4 py-3.5">
      <div className="flex w-11 shrink-0 items-center justify-start">
        <Link
          href={backHref}
          aria-label="Go back"
          className="flex h-9 w-9 items-center justify-center text-ink"
        >
          ←
        </Link>
      </div>
      <h1 className="flex-1 truncate px-1 text-center text-[17px] font-extrabold tracking-tight text-ink">
        {title}
      </h1>
      <div className="flex max-w-[46%] shrink-0 items-center justify-end gap-1">
        {right}
        <HeaderOverflow />
      </div>
    </header>
  )
}
