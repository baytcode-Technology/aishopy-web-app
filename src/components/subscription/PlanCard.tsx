'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import type { ReactNode } from 'react'

type PlanCardTone = 'default' | 'starter-limited' | 'trial-offer'

type Props = {
  emoji: string
  title: string
  price: string
  compareAtPrice?: string
  subtitle?: string
  features: readonly string[]
  isCurrent?: boolean
  selected?: boolean
  tone?: PlanCardTone
  onPress?: () => void
  footer?: ReactNode
  className?: string
}

export function PlanCard({
  emoji,
  title,
  price,
  compareAtPrice,
  subtitle,
  features,
  isCurrent = false,
  selected = false,
  tone = 'default',
  onPress,
  footer,
  className = '',
}: Props) {
  const isStarterLimited = tone === 'starter-limited'
  const isTrialOffer = tone === 'trial-offer' && !!compareAtPrice

  const card = (
    <div
      className={`overflow-hidden rounded-[28px] border bg-surface shadow-sm ${
        isStarterLimited
          ? selected
            ? 'border-[#EF4444] bg-[#FEF2F2]'
            : 'border-[#FECACA] bg-[#FEF2F2]'
          : isTrialOffer && selected
            ? 'border-brand-green bg-[#E8F8EC]'
            : selected
              ? 'border-brand-primary'
              : 'border-gray-200'
      } ${className}`}
    >
      <div className="px-6 pb-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-2xl">{emoji}</p>
            <h2 className="text-xl font-extrabold tracking-tight text-ink">{title}</h2>

            {isTrialOffer ? (
              <div className="mt-3">
                <p className="text-[17px] font-semibold text-gray-500 line-through">{compareAtPrice}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-[28px] font-extrabold leading-8 text-brand-green">{price}</p>
                  <span className="rounded-full bg-brand-green/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-green">
                    1st month
                  </span>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-2xl font-extrabold text-ink">{price}</p>
            )}

            {subtitle ? <p className="mt-1.5 text-[13px] leading-5 text-gray-500">{subtitle}</p> : null}
          </div>

          {isStarterLimited && isCurrent ? (
            <span className="rounded-full bg-[#FEE2E2] px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#EF4444]">
              Limited
            </span>
          ) : isCurrent ? (
            <span
              className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest ${
                isStarterLimited ? 'bg-[#FEE2E2] text-[#EF4444]' : 'bg-brand-primary/10 text-brand-primary'
              }`}
            >
              Current
            </span>
          ) : null}
        </div>
      </div>

      <div className="px-6 pb-2">
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-3 py-2">
            <span className={`mt-0.5 ${isStarterLimited ? 'text-[#EF4444]' : 'text-brand-primary'}`}>
              <MenuIcon name="check" className="h-3 w-3" />
            </span>
            <p className="flex-1 text-[14px] leading-5 text-ink">{feature}</p>
          </div>
        ))}
      </div>

      {footer ? (
        <div
          className="px-6 pb-6 pt-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {footer}
        </div>
      ) : null}
    </div>
  )

  if (onPress) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onPress()
          }
        }}
        className="w-full cursor-pointer text-left"
      >
        {card}
      </div>
    )
  }

  return card
}
