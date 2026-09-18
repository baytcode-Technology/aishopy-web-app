/* AiShopy merchant web — push + notification click only (no offline shell). */
self.addEventListener('push', (event) => {
  let payload = { title: 'AiShopy', body: 'New update', data: {} }
  try {
    if (event.data) {
      const parsed = event.data.json()
      payload = {
        title: typeof parsed.title === 'string' ? parsed.title : payload.title,
        body: typeof parsed.body === 'string' ? parsed.body : payload.body,
        data: parsed.data && typeof parsed.data === 'object' ? parsed.data : {},
      }
    }
  } catch {
    try {
      const text = event.data ? event.data.text() : ''
      if (text) payload.body = text
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/favicon-48.png',
      data: payload.data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const data = event.notification.data || {}
  const path = pathFromNotificationData(data)

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus()
          if ('navigate' in client) {
            await client.navigate(path)
          } else {
            client.postMessage({ type: 'notification-navigate', path })
          }
          return
        }
      }
      if (self.clients.openWindow) {
        await self.clients.openWindow(path)
      }
    })()
  )
})

function pathFromNotificationData(data) {
  const type = typeof data.type === 'string' ? data.type : ''
  const channel = typeof data.channel === 'string' ? data.channel : ''

  if (type === 'support' || channel === 'support') {
    return '/help-center'
  }

  if (type === 'chat') {
    const id = data.conversationId
    if (id != null && String(id).trim()) {
      const chatChannel = channel || 'whatsapp'
      return `/inbox/${encodeURIComponent(String(id))}?channel=${encodeURIComponent(chatChannel)}`
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

  return '/dashboard'
}
