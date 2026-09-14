import type { ChatMessage } from '@/core/types/chat'

type RawPayloadMedia = {
  id?: string
  mime_type?: string
  caption?: string
  filename?: string
}

type RawPayloadReaction = {
  message_id?: string
  emoji?: string
}

/** Fill media / reaction fields from stored webhook payload when DB columns are empty. */
export function enrichMessageFromRawPayload(input: {
  type: string
  textBody: string | null
  mediaId?: string | null
  mimeType?: string | null
  caption?: string | null
  rawPayload?: unknown
}): {
  mediaId?: string
  mimeType?: string
  caption?: string
  textBody: string
  reactionEmoji?: string
  reactionTargetId?: string
} {
  const raw =
    input.rawPayload && typeof input.rawPayload === 'object'
      ? (input.rawPayload as Record<string, unknown>)
      : null

  let mediaId = input.mediaId?.trim() || undefined
  let mimeType = input.mimeType?.trim() || undefined
  let caption = input.caption?.trim() || undefined
  let textBody = input.textBody?.trim() || ''
  let reactionEmoji: string | undefined
  let reactionTargetId: string | undefined

  if (input.type === 'reaction' && raw) {
    const reaction = raw.reaction as RawPayloadReaction | undefined
    reactionTargetId = reaction?.message_id?.trim() || undefined
    reactionEmoji = reaction?.emoji?.trim() || undefined
    if (!textBody && reactionEmoji) {
      textBody = `Reacted ${reactionEmoji}`
    }
    return { textBody, reactionEmoji, reactionTargetId }
  }

  const mediaKeys = ['image', 'video', 'audio', 'document', 'sticker'] as const
  const mediaKey = mediaKeys.find((k) => k === input.type)
  if (mediaKey && raw) {
    const block = raw[mediaKey] as RawPayloadMedia | undefined
    if (!mediaId && block?.id?.trim()) mediaId = block.id.trim()
    if (!mimeType && block?.mime_type?.trim()) mimeType = block.mime_type.trim()
    if (!caption) {
      caption = block?.caption?.trim() || block?.filename?.trim() || undefined
    }
  }

  if (!textBody) {
    if (caption) textBody = caption
    else if (input.type === 'image') textBody = 'Photo'
    else if (input.type === 'video') textBody = 'Video'
    else if (input.type === 'audio') textBody = 'Voice message'
    else if (input.type === 'document') textBody = caption || 'Document'
    else if (input.type === 'sticker') textBody = 'Sticker'
    else textBody = `[${input.type}]`
  }

  return { mediaId, mimeType, caption, textBody, reactionEmoji, reactionTargetId }
}

/** Attach reaction emojis to target messages; hide standalone reaction rows. */
export function prepareWhatsAppMessagesForDisplay(messages: ChatMessage[]): ChatMessage[] {
  const reactionsByTarget = new Map<string, string[]>()

  for (const message of messages) {
    if (message.type !== 'reaction' || !message.reactionTargetId) continue
    const emoji = message.reactionEmoji ?? message.text.replace(/^Reacted\s+/u, '').trim()
    if (!emoji || emoji.startsWith('[')) continue
    const existing = reactionsByTarget.get(message.reactionTargetId) ?? []
    if (!existing.includes(emoji)) existing.push(emoji)
    reactionsByTarget.set(message.reactionTargetId, existing)
  }

  return messages
    .filter((message) => message.type !== 'reaction')
    .map((message) => {
      if (!message.metaMessageId) return message
      const reactions = reactionsByTarget.get(message.metaMessageId)
      if (!reactions?.length) return message
      return { ...message, reactions }
    })
}
