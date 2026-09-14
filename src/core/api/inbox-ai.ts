import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

export async function setChatReplyMode(input: {
  channel: 'whatsapp' | 'instagram'
  storeId: number
  conversationId: number
  replyMode: 'ai' | 'manual'
}): Promise<void> {
  const base =
    input.channel === 'whatsapp'
      ? endpoints.whatsappReplyMode(input.conversationId, input.storeId)
      : endpoints.instagramReplyMode(input.conversationId, input.storeId)

  await authenticatedFetch(base, {
    method: 'POST',
    body: JSON.stringify({ reply_mode: input.replyMode }),
  })
}
