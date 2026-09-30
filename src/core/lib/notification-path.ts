/** Maps push / notification data to an in-app path (keep in sync with public/sw.js). */
export function pathFromNotificationData(data: Record<string, unknown> | null | undefined): string {
  if (!data || typeof data !== 'object') return '/products'

  const type = typeof data.type === 'string' ? data.type : ''
  const channel = typeof data.channel === 'string' ? data.channel : ''

  if (type === 'ticket_raised' || type === 'support_message') {
    const id = data.conversationId
    if (id != null && String(id).trim()) {
      return `/platform-support/${encodeURIComponent(String(id))}`
    }
    return '/platform-admin/workspace/support'
  }

  if (type === 'user_signed_up') {
    return '/platform-admin/workspace/users'
  }

  if (type === 'support' || channel === 'support') {
    return '/help-center'
  }

  if (type === 'chat') {
    const id = data.conversationId
    if (id != null && String(id).trim()) {
      const chatChannel = channel || 'whatsapp'
      const params = new URLSearchParams({ channel: chatChannel })
      const phone = typeof data.phone === 'string' ? data.phone.trim() : ''
      if (phone) params.set('phone', phone)
      return `/inbox/${encodeURIComponent(String(id))}?${params.toString()}`
    }
    return '/inbox'
  }

  if (type === 'order') {
    const id = data.orderId
    if (id != null && String(id).trim()) {
      return `/orders/${encodeURIComponent(String(id))}`
    }
    return '/orders'
  }

  return '/products'
}
