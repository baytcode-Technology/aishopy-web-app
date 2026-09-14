export type ChatChannel = 'whatsapp' | 'instagram'

export type ChatListItem = {
  id: number
  channel: ChatChannel
  title: string
  subtitle: string
  time: string
  sortAt: string | null
  unread: number
  online: boolean
  phone: string
  initials: string
  replyMode?: 'ai' | 'manual'
  aiPausedUntil?: string | null
  /** Chat Boat is auto-replying in this thread */
  aiHandling?: boolean
}

export type ChatMessage = {
  id: number
  /** Stable key for optimistic sends — prevents remount on server ack. */
  clientKey?: string
  metaMessageId?: string
  type?: string
  text: string
  time: string
  timestamp: string | null
  outgoing: boolean
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'
  pending?: boolean
  mediaId?: string
  mimeType?: string
  caption?: string
  mediaUrl?: string
  reactionEmoji?: string
  reactionTargetId?: string
  reactions?: string[]
}
