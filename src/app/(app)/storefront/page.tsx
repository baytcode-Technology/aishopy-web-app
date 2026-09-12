'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { StoreAvatar } from '@/components/store/StoreAvatar'
import { StorePickerList } from '@/components/store/StorePickerList'
import { StorefrontUrlActions } from '@/components/store/StorefrontUrlActions'
import { env } from '@/core/config/env'
import { buildSubdomainUrl } from '@/core/lib/storefront'
import type { StoreAccessRole } from '@/core/types/store'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'

function RoleBadge({ role }: { role: StoreAccessRole }) {
  return (
    <div className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {role === 'owner' ? 'Owner' : 'Staff'}
      </p>
    </div>
  )
}

export default function StorefrontPage() {
  const router = useRouter()
  const { store, stores, role, subdomainUrl, refreshStores, switchStore } = useStore()
  const selectingRef = useRef(false)

  useEffect(() => {
    void refreshStores()
  }, [refreshStores])

  const storefrontHost = store?.slug ? `${store.slug}.${env.storefrontBaseDomain}` : null
  const storefrontUrl = subdomainUrl ?? (store?.slug ? buildSubdomainUrl(store.slug) : null)

  const handleSelectStore = async (storeId: number) => {
    if (selectingRef.current) return
    selectingRef.current = true
    try {
      if (store?.id === storeId) {
        router.replace('/inbox')
        return
      }
      const ok = await switchStore(storeId)
      if (ok) router.replace('/inbox')
    } finally {
      selectingRef.current = false
    }
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Storefront"
        subtitle="Your stores & live links"
        showSettings={false}
        onBack={() => router.back()}
      />
      <div className="px-5 pb-10 pt-2">
        <p className="mb-4 text-[14px] leading-5 text-gray-500">
          Select a store to manage in the app. Share each storefront link with customers on
          WhatsApp, Instagram, or anywhere you sell.
        </p>

        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Your stores
        </p>

        <StorePickerList
          stores={stores}
          selectedStoreId={store?.id}
          onSelect={(storeId) => void handleSelectStore(storeId)}
        />

        {store ? (
          <div className="mt-5 rounded-[28px] border border-gray-200 bg-surface p-6 shadow-sm">
            <div className="mb-4 self-start rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                Currently selected store
              </p>
            </div>

            <div className="mb-4 flex items-center gap-4">
              <StoreAvatar store={store} />
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Store name
                </p>
                <h2 className="text-xl font-semibold tracking-tight text-ink">{store.name}</h2>
                {role ? (
                  <div className="mt-2 self-start">
                    <RoleBadge role={role} />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Store URL
              </p>
              {storefrontHost && storefrontUrl ? (
                <StorefrontUrlActions url={storefrontUrl} displayHost={storefrontHost} />
              ) : (
                <p className="text-[15px] text-gray-500">No storefront URL yet</p>
              )}
            </div>

            <Link href="/create-store" className="mt-5 inline-block text-[14px] font-semibold text-brand-green">
              Create another store
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  )
}
