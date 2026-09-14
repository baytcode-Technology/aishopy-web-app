'use client'

import { PRODUCT_STATUS_THEME } from '@/core/lib/product-status'
import type { RazorpayMode } from '@/core/types/payment-config'

type Props = {
  enabled: boolean
  mode?: RazorpayMode
}

function StatusPill({
  label,
  badgeBg,
  badgeText,
}: {
  label: string
  badgeBg: string
  badgeText: string
}) {
  return (
    <span className="rounded-full px-2.5 py-1 text-[12px] font-semibold" style={{ backgroundColor: badgeBg, color: badgeText }}>
      {label}
    </span>
  )
}

export function PaymentMethodStatusBadge({ enabled, mode }: Props) {
  const theme = enabled ? PRODUCT_STATUS_THEME.active : PRODUCT_STATUS_THEME.unlisted
  const modeLabel = mode === 'live' ? 'Live mode' : mode === 'test' ? 'Test mode' : null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusPill
        label={enabled ? 'Enabled' : 'Disabled'}
        badgeBg={theme.badgeBg}
        badgeText={theme.badgeText}
      />
      {enabled && modeLabel ? (
        <StatusPill
          label={modeLabel}
          badgeBg={PRODUCT_STATUS_THEME.active.badgeBg}
          badgeText={PRODUCT_STATUS_THEME.active.badgeText}
        />
      ) : null}
    </div>
  )
}
