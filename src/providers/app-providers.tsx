'use client'

import { AuthProvider } from '@/providers/auth-provider'
import { ChatSocketProvider } from '@/providers/chat-socket-provider'
import { ChatsUnreadProvider } from '@/providers/chats-unread-provider'
import { OrdersUnreadProvider } from '@/providers/orders-unread-provider'
import { SupportUnreadProvider } from '@/providers/support-unread-provider'
import { StoreProvider } from '@/providers/store-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { WebPushLifecycle } from '@/components/notifications/WebPushLifecycle'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <WebPushLifecycle />
          <ChatSocketProvider>
            <ChatsUnreadProvider>
              <SupportUnreadProvider>
                <OrdersUnreadProvider>{children}</OrdersUnreadProvider>
              </SupportUnreadProvider>
            </ChatsUnreadProvider>
          </ChatSocketProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
