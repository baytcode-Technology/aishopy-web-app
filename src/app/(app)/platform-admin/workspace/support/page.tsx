'use client'

import { PlatformSupportInboxContent } from '@/components/admin/PlatformSupportInboxContent'
import { useRouter } from 'next/navigation'

export default function AdminWorkspaceSupportPage() {
  const router = useRouter()

  return (
    <main className="flex min-h-full flex-col bg-gray-100">
      <PlatformSupportInboxContent onBack={() => router.push('/platform-admin')} />
    </main>
  )
}
