'use client'

import { DeleteAccountSection } from '@/components/account/DeleteAccountSection'
import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { EditStoreLogoModal } from '@/components/store/EditStoreLogoModal'
import { EditStoreModal } from '@/components/store/EditStoreModal'
import { StoreAvatar } from '@/components/store/StoreAvatar'
import { StoreLogoEditLink } from '@/components/store/StoreLogoPicker'
import { StorefrontUrlActions } from '@/components/store/StorefrontUrlActions'
import { Button } from '@/components/ui/Button'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { MenuRow } from '@/components/ui/MenuRow'
import { ThemeToggleChip } from '@/components/ui/ThemeToggleChip'
import { UnreadCountBadge } from '@/components/ui/UnreadCountBadge'
import { env } from '@/core/config/env'
import { buildSubdomainUrl } from '@/core/lib/storefront'
import { getPlanLabel, getStorePlan } from '@/core/lib/subscription'
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL, TERMS_OF_USE_URL } from '@/core/lib/support-contact'
import type { Store } from '@/core/types/store'
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin'
import { useSupportAdminSummary } from '@/hooks/useSupportAdminSummary'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function comingSoonHref(id: string) {
  return `/account-coming-soon?id=${id}`
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const { store, refreshStore, activateStoreSession, subdomainUrl, clearStore, role } = useStore()
  const [editOpen, setEditOpen] = useState(false)
  const [logoOpen, setLogoOpen] = useState(false)
  const { isPlatformAdmin } = usePlatformAdmin()
  const { summary } = useSupportAdminSummary(isPlatformAdmin)
  const openTickets = summary.escalated_count
  const unreadOnTickets = summary.unread_messages

  const handleStoreUpdated = async (updated: Store) => {
    const url = subdomainUrl ?? buildSubdomainUrl(updated.slug)
    await activateStoreSession(updated, url, role ?? 'owner')
    await refreshStore()
  }

  const handleSignOut = async () => {
    await clearStore()
    await signOut()
    router.replace('/login')
  }

  const handleSendFeedback = () => {
    const subject = encodeURIComponent('AiShopy feedback')
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share feedback.\n\nStore: ${store?.name ?? '—'}\nAccount: ${user?.email ?? '—'}\n\n`,
    )
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
  }

  const storefrontHost = store?.slug ? `${store.slug}.${env.storefrontBaseDomain}` : null
  const storefrontUrl = store?.slug ? buildSubdomainUrl(store.slug) : subdomainUrl
  const isAdminWithoutStore = isPlatformAdmin && !store

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Settings"
        subtitle={isAdminWithoutStore ? 'Platform admin' : 'Store & profile'}
        showSettings={false}
        onBack={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back()
            return
          }
          router.push(isAdminWithoutStore ? '/platform-admin' : '/dashboard')
        }}
      />

      {isAdminWithoutStore ? (
        <div className="flex flex-col gap-3 px-5 pb-32 pt-4">
          <div className="relative rounded-[28px] border border-gray-200 bg-surface px-6 py-5 shadow-sm">
            <div className="absolute right-5 top-5 flex items-center gap-2">
              <ThemeToggleChip />
            </div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
              Admin account
            </p>
            <p className="text-[15px] text-gray-500">{user?.email}</p>
            <p className="mt-2 text-[13px] leading-5 text-gray-500">
              No store linked. Use Support inbox for merchant Chat with AI.
            </p>
          </div>

          <MenuRow
            label="Admin home"
            value="Platform support dashboard"
            icon="home"
            showChevron
            onPress={() => router.replace('/platform-admin')}
          />
          <MenuRow
            label="Support inbox"
            value="AiShopy merchant Chat with AI"
            icon="inbox"
            showChevron
            onPress={() => router.push('/platform-support-inbox')}
          />
          <MenuRow
            label="Create a store"
            value="Optional"
            icon="shopping-bag"
            showChevron
            onPress={() => router.push('/create-store')}
          />
          <MenuRow
            label="AI & data privacy"
            value="What Chat Boat shares with AI providers"
            icon="shield"
            showChevron
            onPress={() => router.push('/ai-privacy')}
          />

          <div className="flex flex-col gap-3 pt-4">
            <Button label="Sign out" variant="destructive" onClick={() => void handleSignOut()} />
            <DeleteAccountSection />
          </div>
        </div>
      ) : (
        <>
          <div className="px-5 pb-4 pt-2">
            <div className="relative rounded-[28px] border border-gray-200 bg-surface px-6 py-3 shadow-sm">
              <div className="absolute right-5 top-5 flex items-center gap-2">
                <ThemeToggleChip />
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <MenuIcon name="pencil" className="h-3 w-3 text-brand-primary" />
                  <span className="text-xs font-bold text-ink">Edit</span>
                </button>
              </div>

              <div className="mb-4 items-start">
                <StoreAvatar store={store} />
                <StoreLogoEditLink onPress={() => setLogoOpen(true)} />
              </div>

              <h2 className="pr-16 text-2xl font-semibold tracking-tight text-ink">
                {store?.name ?? 'Your store'}
              </h2>
              {user?.email ? (
                <p className="mt-2 text-[15px] text-gray-500">{user.email}</p>
              ) : null}
              {storefrontHost && storefrontUrl ? (
                <StorefrontUrlActions url={storefrontUrl} displayHost={storefrontHost} />
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 pb-32">
            <MenuRow
              label="Storefront"
              value={storefrontHost ?? 'Your store link'}
              icon="globe"
              showChevron
              onPress={() => router.push('/storefront')}
            />
            <MenuRow
              label="Website"
              value="UI design & customization"
              icon="paint-brush"
              showChevron
              onPress={() => router.push('/website-customize')}
            />
            <MenuRow label="Currency" value={store?.currency ?? 'INR'} icon="money" />
            <MenuRow
              label="Payment methods"
              value="COD, cards & more"
              icon="credit-card"
              showChevron
              onPress={() => router.push('/payment-methods')}
            />
            <MenuRow
              label="Notifications"
              value="Orders, chats & alerts"
              icon="bell"
              showChevron
              onPress={() => router.push('/notifications')}
            />
            <MenuRow
              label="Chat Boat"
              value="Inbox auto-reply on or off"
              icon="magic"
              showChevron
              onPress={() => router.push('/chat-boat')}
            />
            <MenuRow
              label="Printer"
              value="Receipts & labels"
              icon="print"
              showChevron
              onPress={() => router.push(comingSoonHref('printer'))}
            />
            <MenuRow
              label="Subscription"
              value={store ? getPlanLabel(getStorePlan(store)) : 'Choose a plan'}
              icon="calendar"
              showChevron
              onPress={() => router.push('/subscription')}
            />
            {role === 'owner' ? (
              <MenuRow
                label="Admin Dashboard"
                value="WhatsApp · Instagram · Chat Boat · Domain"
                icon="cog"
                showChevron
                onPress={() => router.push('/admin-dashboard')}
              />
            ) : null}

            <div className="mt-2 flex flex-col gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">
                Support
              </p>

              {isPlatformAdmin ? (
                <div className="relative">
                  <MenuRow
                    label="Support inbox"
                    value={
                      openTickets > 0
                        ? `${openTickets} open ticket${openTickets === 1 ? '' : 's'}`
                        : unreadOnTickets > 0
                          ? `${unreadOnTickets} unread on tickets`
                          : 'AiShopy merchant Chat with AI'
                    }
                    icon="inbox"
                    showChevron
                    onPress={() => router.push('/platform-support-inbox')}
                  />
                  {unreadOnTickets > 0 ? (
                    <div className="absolute right-5 top-3">
                      <UnreadCountBadge count={unreadOnTickets} />
                    </div>
                  ) : null}
                </div>
              ) : null}

              <MenuRow
                label="Send feedback"
                value=""
                icon="comment-o"
                showChevron
                onPress={handleSendFeedback}
              />
              <MenuRow
                label="Help center"
                value=""
                icon="question-circle-o"
                showChevron
                onPress={() => router.push('/help-center')}
              />
              <MenuRow
                label="Privacy policy"
                value=""
                icon="lock"
                showChevron
                onPress={() => window.open(PRIVACY_POLICY_URL, '_blank', 'noopener,noreferrer')}
              />
              <MenuRow
                label="AI & data privacy"
                value="What Chat Boat shares with AI providers"
                icon="shield"
                showChevron
                onPress={() => router.push('/ai-privacy')}
              />
              <MenuRow
                label="Terms"
                value=""
                icon="file-text-o"
                showChevron
                onPress={() => window.open(TERMS_OF_USE_URL, '_blank', 'noopener,noreferrer')}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button label="Sign out" variant="destructive" onClick={() => void handleSignOut()} />
              <DeleteAccountSection storeName={store?.name} />
            </div>
          </div>

          <EditStoreModal
            open={editOpen}
            store={store}
            onClose={() => setEditOpen(false)}
            onUpdated={(updated) => void handleStoreUpdated(updated)}
          />
          <EditStoreLogoModal
            open={logoOpen}
            store={store}
            onClose={() => setLogoOpen(false)}
            onUpdated={(updated) => void handleStoreUpdated(updated)}
          />
        </>
      )}
    </main>
  )
}
