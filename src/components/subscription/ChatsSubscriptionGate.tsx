'use client'

import { Button } from '@/components/ui/Button'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { CHAT_GATE_FEATURES } from '@/core/lib/subscription'

type Props = {
  onViewPlans: () => void
}

export function ChatsSubscriptionGate({ onViewPlans }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center px-5 pb-10 pt-6">
      <div className="w-full rounded-[28px] border border-gray-200 bg-surface px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <MenuIcon name="crown" className="h-7 w-7 text-brand-primary" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Unlock WhatsApp & Instagram inbox
        </h2>
        <p className="mt-3 text-[15px] leading-6 text-gray-500">
          Upgrade to Business to manage customer conversations, automate replies, and grow sales
          from chat.
        </p>

        <div className="mt-6 flex w-full flex-col gap-2 text-left">
          {CHAT_GATE_FEATURES.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <MenuIcon name="check" className="mt-1 h-3 w-3 shrink-0 text-brand-primary" />
              <p className="flex-1 text-[14px] leading-5 text-ink">{feature}</p>
            </div>
          ))}
        </div>

        <Button label="View plans" onClick={onViewPlans} className="mt-8" />
      </div>
    </div>
  )
}
