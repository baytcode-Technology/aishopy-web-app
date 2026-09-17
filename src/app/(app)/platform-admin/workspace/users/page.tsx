'use client'

import { AdminUsersDirectory } from '@/components/admin/AdminUsersDirectory'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { useRouter } from 'next/navigation'

export default function AdminWorkspaceUsersPage() {
  const router = useRouter()

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Users"
        subtitle="Signed-in merchants and their stores"
        onBack={() => router.push('/platform-admin')}
        showSettings={false}
      />
      <div className="px-5 pb-8 pt-2">
        <AdminUsersDirectory />
      </div>
    </main>
  )
}
