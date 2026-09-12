'use client'

import { DeleteAccountSection } from '@/components/account/DeleteAccountSection'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { LockedMenuRow } from '@/components/ui/LockedMenuRow'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { env } from '@/core/config/env'
import { hasPremiumAccess } from '@/core/lib/subscription'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function comingSoonHref(id: string) {
  return `/account-coming-soon?id=${id}`
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const premium = hasPremiumAccess(store)
  const [domainOpen, setDomainOpen] = useState(false)
  const [customDomainComingSoon, setCustomDomainComingSoon] = useState(false)

  useEffect(() => {
    if (role === 'staff') router.replace('/settings')
  }, [role, router])

  if (role === 'staff') return null

  const currentDomain = store?.slug ? `${store.slug}.${env.storefrontBaseDomain}` : '—'

  const goToSubscription = () => router.push(comingSoonHref('subscription'))

  const handleDomainPress = () => {
    if (!premium) {
      goToSubscription()
      return
    }
    setDomainOpen((open) => !open)
    if (domainOpen) setCustomDomainComingSoon(false)
  }

  const handleCustomDomainPress = () => {
    if (!premium) {
      goToSubscription()
      return
    }
    setCustomDomainComingSoon(true)
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Admin Dashboard"
        subtitle="Connect channels and manage integrations"
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-2">
        <p className="mb-1 text-[14px] leading-5 text-gray-500">
          Link your business accounts through Meta. Manage your store domain below.
        </p>

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="WhatsApp"
          value="Connect phone + inbox"
          icon="whatsapp"
          showChevron
          onPress={() => router.push(comingSoonHref('whatsapp'))}
        />

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="Instagram"
          value="Connect business account"
          icon="instagram"
          showChevron
          onPress={() => router.push(comingSoonHref('instagram'))}
        />

        <LockedMenuRow
          locked={!premium}
          onLockedPress={goToSubscription}
          label="Chat Boat"
          value="Smart assistant for your store"
          icon="magic"
          showChevron
          onPress={() => router.push(comingSoonHref('chat-boat'))}
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

        <div>
          <LockedMenuRow
            locked={!premium}
            onLockedPress={goToSubscription}
            label="Domain"
            value={domainOpen ? 'Hide domain settings' : 'Current & custom domain'}
            icon="globe"
            showChevron={premium}
            onPress={handleDomainPress}
          />

          {domainOpen && premium ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Current domain
                </p>
                <p className="text-[15px] font-semibold text-ink">{currentDomain}</p>
                <p className="mt-1.5 text-[13px] text-gray-500">Your live storefront address</p>
              </div>

              <button
                type="button"
                onClick={handleCustomDomainPress}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Custom domain
                  </p>
                  <p className="text-[15px] font-semibold text-ink">Use your own domain</p>
                  <p className="mt-1.5 text-[13px] text-gray-500">e.g. shop.yourbrand.com</p>
                </div>
                <MenuIcon name="chevron-right" className="h-3 w-3 text-gray-400" />
              </button>

              {customDomainComingSoon ? (
                <div className="px-5 pb-4 pt-0">
                  <div className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3">
                    <p className="mb-1 text-[13px] font-bold text-ink">Coming soon</p>
                    <p className="text-[13px] leading-5 text-gray-500">
                      Custom domain setup will be available here. You can connect your own domain to
                      your storefront soon.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <DeleteAccountSection storeName={store?.name} />
      </div>
    </main>
  )
}
