'use client'

import { AppLogo } from '@/components/brand/AppLogo'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/products')
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100">
      <AppLogo href="" />
      <p className="text-sm font-semibold text-gray-500">Opening your catalog…</p>
    </main>
  )
}
