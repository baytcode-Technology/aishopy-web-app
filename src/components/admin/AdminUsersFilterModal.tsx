'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import {
  EMPTY_ADMIN_USERS_FILTERS,
  hasActiveAdminUsersFilters,
  hasStoreLabel,
  planLabel,
  signedAfterLabel,
  type AdminUsersFilters,
} from '@/core/lib/admin-users-filters'
import type { AdminHasStoreFilter, AdminPlanFilter, AdminSignedAfterFilter } from '@/core/types/platform-admin-users'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  filters: AdminUsersFilters
  onClose: () => void
  onApply: (filters: AdminUsersFilters) => void
}

type Section = 'hasStore' | 'plan' | 'signedAfter'

const HAS_STORE_OPTIONS: AdminHasStoreFilter[] = ['yes', 'no']
const PLAN_OPTIONS: AdminPlanFilter[] = ['starter', 'business', 'enterprise']
const SIGNED_OPTIONS: AdminSignedAfterFilter[] = ['7d', '30d', '90d']

export function AdminUsersFilterModal({ open, filters, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<AdminUsersFilters>(filters)
  const [expanded, setExpanded] = useState<Section | null>('hasStore')

  useEffect(() => {
    if (!open) return
    setDraft(filters)
    setExpanded('hasStore')
  }, [open, filters])

  const handleApply = () => {
    onApply(draft)
    onClose()
  }

  const handleClear = () => {
    setDraft(EMPTY_ADMIN_USERS_FILTERS)
    onApply(EMPTY_ADMIN_USERS_FILTERS)
    onClose()
  }

  return (
    <Modal open={open} title="Filter users" onClose={onClose}>
      <FilterSection
        title="Store created"
        open={expanded === 'hasStore'}
        onToggle={() => setExpanded(expanded === 'hasStore' ? null : 'hasStore')}
      >
        {HAS_STORE_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            label={hasStoreLabel(option)}
            active={draft.hasStore === option}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                hasStore: prev.hasStore === option ? null : option,
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection
        title="Plan"
        open={expanded === 'plan'}
        onToggle={() => setExpanded(expanded === 'plan' ? null : 'plan')}
      >
        {PLAN_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            label={planLabel(option)}
            active={draft.plan === option}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                plan: prev.plan === option ? null : option,
              }))
            }
          />
        ))}
      </FilterSection>

      <FilterSection
        title="Signed up"
        open={expanded === 'signedAfter'}
        onToggle={() => setExpanded(expanded === 'signedAfter' ? null : 'signedAfter')}
      >
        {SIGNED_OPTIONS.map((option) => (
          <OptionButton
            key={option}
            label={signedAfterLabel(option)}
            active={draft.signedAfter === option}
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                signedAfter: prev.signedAfter === option ? null : option,
              }))
            }
          />
        ))}
      </FilterSection>

      <div className="mt-4 flex flex-col gap-2">
        {hasActiveAdminUsersFilters(draft) ? (
          <button
            type="button"
            onClick={handleClear}
            className="py-2 text-center text-[14px] font-semibold text-gray-500"
          >
            Clear filters
          </button>
        ) : null}
        <Button label="Apply filters" onClick={handleApply} />
      </div>
    </Modal>
  )
}

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="border-b border-gray-100">
      <button type="button" onClick={onToggle} className="flex w-full items-center justify-between py-4">
        <span className="text-[16px] font-semibold text-ink">{title}</span>
        <span className="text-[14px] text-gray-400">{open ? '▴' : '▾'}</span>
      </button>
      {open ? <div className="flex flex-col gap-2.5 pb-4">{children}</div> : null}
    </div>
  )
}

function OptionButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3.5 text-left ${
        active ? 'border-ink bg-gray-50' : 'border-gray-200 bg-surface'
      }`}
    >
      <span className={`text-[15px] ${active ? 'font-semibold text-ink' : 'font-medium text-gray-500'}`}>
        {label}
      </span>
    </button>
  )
}
