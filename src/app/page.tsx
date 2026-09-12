'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { useAuth } from '@/providers/auth-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomeGatePage() {
  const { isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    router.replace(isAuthenticated ? '/store-check' : '/login')
  }, [isAuthenticated, isLoading, router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
      <AppLogo href="" />
      <p className="text-sm font-semibold text-gray-500">Preparing your workspace…</p>
    </main>
  )
}
