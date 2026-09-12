'use client'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { deleteAccount } from '@/core/api/auth'
import { getErrorMessage } from '@/core/lib/api-error'
import { useAuth } from '@/providers/auth-provider'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type Props = {
  storeName?: string | null
  /** Card is for Settings. Link is a quiet footer action on Create store. */
  variant?: 'card' | 'link'
}

export function DeleteAccountSection({ storeName, variant = 'card' }: Props) {
  const router = useRouter()
  const { signOut, user } = useAuth()
  const { clearStore, store, role, stores } = useStore()
  const [step, setStep] = useState<'closed' | 'warn' | 'confirm'>('closed')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ownedStoreNames = useMemo(() => {
    const names = stores
      .filter((item) => item.role === 'owner')
      .map((item) => item.store.name)

    const ownsCurrentStore =
      role === 'owner' ||
      (Boolean(user?.id) && Boolean(store?.owner_id) && store?.owner_id === user?.id)

    if (ownsCurrentStore) {
      const currentName = store?.name ?? storeName
      if (currentName && !names.includes(currentName)) {
        names.push(currentName)
      }
    }

    return names
  }, [stores, role, store?.name, store?.owner_id, storeName, user?.id])

  const deletesOwnedStores = ownedStoreNames.length > 0

  const cardDescription = deletesOwnedStores
    ? 'Permanently delete your account and all stores you own. This action cannot be reversed.'
    : 'Permanently delete your AiShopy account. Stores you access as staff are not deleted.'

  const warnMessage = deletesOwnedStores
    ? ownedStoreNames.length === 1
      ? `Your store “${ownedStoreNames[0]}” and all its products, orders, and messages will be permanently deleted. This also removes your AiShopy account and cannot be undone.`
      : `This permanently deletes your AiShopy account and all ${ownedStoreNames.length} stores you own (including products, orders, and messages). Staff access to other people’s stores is removed. This cannot be undone.`
    : 'This permanently removes your AiShopy account and your staff access to any stores. Stores you work in as staff are not deleted. This cannot be undone.'

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      await deleteAccount()
      await clearStore()
      await signOut()
      router.replace('/login')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not delete account'))
      setDeleting(false)
      setStep('closed')
    }
  }

  const trigger =
    variant === 'link' ? (
      <button
        type="button"
        onClick={() => setStep('warn')}
        className="py-1 text-center text-[14px] font-semibold text-gray-500 underline"
      >
        Delete account
      </button>
    ) : (
      <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-100 text-[#E11D48]">
            <MenuIcon name="exclamation-triangle" className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">
              Danger zone
            </p>
            <p className="mt-1 text-[14px] leading-5 text-rose-950">{cardDescription}</p>
          </div>
        </div>
        <Button
          label="Delete account"
          variant="outline"
          onClick={() => setStep('warn')}
          className="border-rose-300 bg-white text-rose-700"
        />
      </div>
    )

  return (
    <>
      {trigger}
      {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

      <ConfirmDialog
        open={step === 'warn'}
        title="Delete account?"
        message={warnMessage}
        confirmLabel="Continue"
        onConfirm={() => setStep('confirm')}
        onCancel={() => setStep('closed')}
      />

      <ConfirmDialog
        open={step === 'confirm'}
        title="Delete forever?"
        message={
          deletesOwnedStores
            ? 'All account data and stores you own will be permanently removed. You will be signed out immediately.'
            : 'Your account and staff access will be permanently removed. Stores you work in as staff are not deleted. You will be signed out immediately.'
        }
        confirmLabel="Delete account"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (!deleting) setStep('closed')
        }}
      />
    </>
  )
}
