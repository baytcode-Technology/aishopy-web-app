'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  onBack?: () => void
}

export function PaymentMethodConfigLayout({ title, subtitle, children, footer, onBack }: Props) {
  return (
    <main className="flex min-h-full flex-col bg-gray-100">
      <CatalogHeader title={title} subtitle={subtitle} onBack={onBack} showSettings={false} />
      <div className="flex flex-1 flex-col">
        <div className="flex min-w-0 grow flex-col gap-4 px-5 pb-6 pt-2">{children}</div>
        {footer ? (
          <div className="w-full border-t border-gray-100 bg-surface px-5 pb-4 pt-3">
            <div className="w-full max-w-full overflow-hidden">{footer}</div>
          </div>
        ) : null}
      </div>
    </main>
  )
}
