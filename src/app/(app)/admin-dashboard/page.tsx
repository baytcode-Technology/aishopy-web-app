'use client'

import { DeleteAccountSection } from '@/components/account/DeleteAccountSection'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { LockedMenuRow } from '@/components/ui/LockedMenuRow'
import { MenuRow } from '@/components/ui/MenuRow'
import { hasPremiumAccess } from '@/core/lib/subscription'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const premium = hasPremiumAccess(store)

  useEffect(() => {
    if (role === 'staff') router.replace('/settings')
  }, [role, router])

  if (role === 'staff') return null

  const goToSubscription = () => router.push('/subscription')

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Admin Dashboard"
        subtitle="Connect channels and manage integrations"
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-2">
        <p className="mb-1 text-[14px] leading-5 text-gray-500">
          Link your business accounts through Meta. Custom domain setup is coming soon.
        </p>

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="WhatsApp"
          value="Connect phone + inbox"
          icon="whatsapp"
          showChevron
          onPress={() => router.push('/connect-whatsapp')}
        />

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="Instagram"
          value="Connect business account"
          icon="instagram"
          showChevron
          onPress={() => router.push('/instagram-connect')}
        />

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="Chat Boat"
          value="Smart assistant for your store"
          icon="magic"
          showChevron
          onPress={() => router.push('/chat-boat')}
        />

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="Staff management"
          value="Invite team & assign roles"
          icon="users"
          showChevron
          onPress={() => router.push('/staff-management')}
        />

        <MenuRow
          label="Domain"
          value="Coming soon"
          icon="globe"
          showChevron
          onPress={() => router.push('/account-coming-soon?id=custom-domain')}
        />

        <DeleteAccountSection storeName={store?.name} />
      </div>
    </main>
  )
}
