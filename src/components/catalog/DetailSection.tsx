import type { ReactNode } from 'react'

export function DetailSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`overflow-hidden rounded-2xl border border-gray-300 bg-surface ${className}`}>
      {children}
    </section>
  )
}
