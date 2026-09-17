'use client'

import { AdminWorkspaceShell } from '@/components/admin/AdminWorkspaceShell'
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'

export default function AdminWorkspaceLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isPlatformAdmin, isLoading } = usePlatformAdmin()

  useEffect(() => {
    if (!isLoading && !isPlatformAdmin) {
      router.replace('/dashboard')
    }
  }, [isLoading, isPlatformAdmin, router])

  if (isLoading || !isPlatformAdmin) {
    return (
      <main className="flex min-h-full items-center justify-center bg-gray-100">
        <p className="text-sm font-semibold text-gray-500">Loading…</p>
      </main>
    )
  }

  return <AdminWorkspaceShell>{children}</AdminWorkspaceShell>
}
