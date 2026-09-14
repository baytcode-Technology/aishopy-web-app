'use client'

import type { SupportConversation } from '@/core/types/support'

type Props = {
  conversation: SupportConversation | null
}

/** Only shown while a ticket is open (escalated). */
export function SupportStatusStrip({ conversation }: Props) {
  if (!conversation || conversation.status !== 'escalated') return null

  const code = conversation.ticket_code
  let label = code ? `${code} · Ticket raised` : 'Ticket raised'

  if (conversation.reply_mode === 'manual') {
    label = code ? `${code} · Support team responding` : 'Support team responding'
  }

  return (
    <div className="w-full border-b border-brand-green/20 bg-[#E8F8EC] px-4 py-2" style={{ minHeight: 36 }}>
      <p className="truncate text-center text-[12px] font-semibold text-brand-green">{label}</p>
    </div>
  )
}
