'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import type { ChatChannel, ChatListItem } from '@/core/types/chat'

const CHANNEL_AVATAR: Record<ChatChannel, { icon: 'whatsapp' | 'instagram'; bg: string }> = {
  whatsapp: { icon: 'whatsapp', bg: '#25D366' },
  instagram: { icon: 'instagram', bg: '#E1306C' },
}

type Props = {
  conversation: ChatListItem
  onPress: () => void
}

export function ConversationRow({ conversation, onPress }: Props) {
  const avatar = CHANNEL_AVATAR[conversation.channel]

  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`${conversation.channel} conversation with ${conversation.title}`}
      className="flex w-full items-center gap-3 border-b border-gray-200 bg-surface px-4 py-3.5 text-left"
    >
      <div className="relative">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: avatar.bg }}
        >
          <MenuIcon name={avatar.icon} className="h-[22px] w-[22px] text-white" />
        </div>
        {conversation.online ? (
          <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand-primary" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="mr-2 flex min-w-0 flex-1 items-center gap-1.5">
            <p className="flex-1 truncate text-base font-bold text-ink">{conversation.title}</p>
            {conversation.aiHandling ? (
              <MenuIcon name="magic" className="h-3 w-3 shrink-0 text-brand-primary" />
            ) : null}
          </div>
          <p className="shrink-0 text-[12px] font-medium text-gray-500">{conversation.time}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="flex-1 truncate text-[14px] text-gray-500">{conversation.subtitle}</p>
          {conversation.unread > 0 ? <UnreadCountBadge count={conversation.unread} /> : null}
        </div>
      </div>
    </button>
  )
}
