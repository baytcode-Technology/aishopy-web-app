import Link from 'next/link'
import type { ReactNode } from 'react'
import { AppLogo } from '@/components/brand/AppLogo'

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-semibold text-ink">{title}</h2>
      <div className="text-sm leading-6 text-gray-600">{children}</div>
    </section>
  )
}

export function LegalScreen({
  title,
  subtitle,
  lastUpdated,
  children,
}: {
  title: string
  subtitle: string
  lastUpdated: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <AppLogo />
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-gray-500">{subtitle}</p>
      <p className="mt-1 text-xs text-gray-400">Last updated {lastUpdated}</p>
      <div className="mt-8">{children}</div>
      <Link href="/login" className="mt-8 inline-block text-sm font-semibold text-brand-green">
        Back
      </Link>
    </main>
  )
}
