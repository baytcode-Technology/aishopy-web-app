'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { Modal } from '@/components/ui/Modal'
import { fetchStoreStaff, inviteStoreStaff, removeStoreStaff } from '@/core/api/stores'
import { getErrorMessage } from '@/core/lib/api-error'
import type { StoreStaffMember } from '@/core/types/store'
import { useStore } from '@/providers/store-provider'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

function RoleBadge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">{label}</p>
    </div>
  )
}

export default function StaffManagementPage() {
  const router = useRouter()
  const { store, role } = useStore()
  const [members, setMembers] = useState<StoreStaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [removeTarget, setRemoveTarget] = useState<StoreStaffMember | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const isOwner = role === 'owner'

  const loadStaff = useCallback(async () => {
    if (!store?.id || !isOwner) {
      setMembers([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetchStoreStaff(store.id)
      setMembers(res.data.members)
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load staff'))
    } finally {
      setIsLoading(false)
    }
  }, [store?.id, isOwner])

  useEffect(() => {
    void loadStaff()
  }, [loadStaff])

  const handleInvite = async () => {
    if (!store?.id || isSubmitting) return
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Email is required')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await inviteStoreStaff(store.id, trimmed)
      setNotice(
        res.data.staff.status === 'pending'
          ? `${res.message} They will get access when they sign up.`
          : res.message,
      )
      setEmail('')
      setModalOpen(false)
      await loadStaff()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to add staff'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemove = async (staffId: number) => {
    if (!store?.id || removingId != null) return
    setRemovingId(staffId)
    setError(null)
    try {
      await removeStoreStaff(store.id, staffId)
      setNotice('Staff removed')
      setRemoveTarget(null)
      await loadStaff()
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to remove staff'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Staff management"
        subtitle="Team access for this store"
        showSettings={false}
        onBack={() => router.back()}
      />
      <div className="flex flex-col gap-4 px-5 pb-10 pt-2">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        {!isOwner ? (
          <div className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
            <p className="text-[15px] leading-6 text-gray-500">
              Only the store owner can invite and manage staff for this store.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[14px] leading-5 text-gray-500">
              Invite teammates by email. They can help with products, orders, and chats once they
              join.
            </p>

            <div className="max-w-[160px]">
              <Button label="Add staff" onClick={() => setModalOpen(true)} />
            </div>

            {isLoading ? (
              <div className="mt-6 flex justify-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-green" />
              </div>
            ) : (
              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-surface shadow-sm">
                {members.map((member, index) => (
                  <div
                    key={`${member.email}-${member.role}`}
                    className={`flex items-center gap-3 px-5 py-4 ${
                      index < members.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                      <MenuIcon
                        name={member.role === 'owner' ? 'star' : 'user'}
                        className="h-4 w-4"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-ink">{member.email}</p>
                      <p className="mt-0.5 text-[12px] capitalize text-gray-400">
                        {member.status === 'owner'
                          ? 'Store creator'
                          : member.status === 'pending'
                            ? 'Invite pending'
                            : 'Active staff'}
                      </p>
                    </div>
                    <RoleBadge
                      label={
                        member.role === 'owner'
                          ? 'Owner'
                          : member.status === 'pending'
                            ? 'Pending'
                            : 'Staff'
                      }
                    />
                    {member.role === 'staff' && member.id != null ? (
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(member)}
                        disabled={removingId === member.id}
                        className="p-2 text-gray-400"
                      >
                        {removingId === member.id ? (
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
                        ) : (
                          <MenuIcon name="trash-o" className="h-4 w-4" />
                        )}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Add staff"
        subtitle="Enter their AiShopy account email"
        onClose={() => {
          if (!isSubmitting) {
            setModalOpen(false)
            setEmail('')
          }
        }}
        footer={
          <div className="flex w-full gap-3">
            <Button
              label="Cancel"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                if (!isSubmitting) {
                  setModalOpen(false)
                  setEmail('')
                }
              }}
            />
            <Button
              label={isSubmitting ? 'Adding…' : 'Add'}
              onClick={() => void handleInvite()}
              disabled={isSubmitting}
            />
          </div>
        }
      >
        <Input
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="teammate@example.com"
          autoCapitalize="none"
          autoCorrect="off"
          type="email"
          disabled={isSubmitting}
        />
      </Modal>

      <ConfirmDialog
        open={removeTarget != null}
        title="Remove staff?"
        message={
          removeTarget
            ? `Remove ${removeTarget.email} from this store? They will lose access to products, orders, and chats.`
            : ''
        }
        confirmLabel="Remove"
        loading={removingId != null}
        onCancel={() => {
          if (removingId == null) setRemoveTarget(null)
        }}
        onConfirm={() => {
          if (removeTarget?.id != null) {
            void handleRemove(removeTarget.id)
          }
        }}
      />
    </main>
  )
}
