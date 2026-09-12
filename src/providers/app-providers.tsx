'use client'

import { AuthProvider } from '@/providers/auth-provider'
import { StoreProvider } from '@/providers/store-provider'
import type { ReactNode } from 'react'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <StoreProvider>{children}</StoreProvider>
    </AuthProvider>
  )
}
