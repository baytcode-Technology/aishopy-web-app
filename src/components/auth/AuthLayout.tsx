import type { ReactNode } from 'react'
import { AppLogo } from '@/components/brand/AppLogo'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-6 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-gray-200 bg-surface px-7 pb-7 pt-6 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
        <div className="mb-2.5 flex justify-center">
          <AppLogo />
        </div>
        <h1 className="mb-2 text-center text-2xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mb-7 text-center text-[13px] leading-[22px] text-gray-500">
          {subtitle}
        </p>
        <div className="flex w-full flex-col gap-5">{children}</div>
        {footer ? (
          <div className="mt-7 w-full border-t border-gray-100 pt-6 text-center">
            {footer}
          </div>
        ) : null}
      </div>
    </main>
  )
}
