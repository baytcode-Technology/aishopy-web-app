'use client'

import { AuthProvider } from '@/providers/auth-provider'
import { OrdersUnreadProvider } from '@/providers/orders-unread-provider'
import { StoreProvider } from '@/providers/store-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <OrdersUnreadProvider>{children}</OrdersUnreadProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
