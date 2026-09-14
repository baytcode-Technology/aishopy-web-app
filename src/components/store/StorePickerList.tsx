'use client'

import { StoreAvatar } from '@/components/store/StoreAvatar'
import { MenuIcon } from '@/components/ui/MenuIcons'
import { env } from '@/core/config/env'
import type { StoreAccessRole, StoreListItem } from '@/core/types/store'

function RoleBadge({ role }: { role: StoreAccessRole }) {
  return (
    <div className="rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
        {role === 'owner' ? 'Owner' : 'Staff'}
      </p>
    </div>
  )
}

type Props = {
  stores: StoreListItem[]
  selectedStoreId?: number | null
  lastSessionStoreId?: number | null
  isLoading?: boolean
  onSelect: (storeId: number, storeName: string) => void
}

export function StorePickerList({
  stores,
  selectedStoreId,
  lastSessionStoreId,
  isLoading = false,
  onSelect,
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-brand-primary" />
      </div>
    )
  }

  if (stores.length === 0) {
    return (
      <div className="px-4 py-8">
        <p className="text-center text-[15px] text-gray-500">No stores found for this account.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-surface shadow-sm">
      {stores.map((item, index) => {
        const host = `${item.store.slug}.${env.storefrontBaseDomain}`
        const selected = selectedStoreId === item.store.id
        const wasLastUsed =
          !selected && lastSessionStoreId != null && lastSessionStoreId === item.store.id

        return (
          <button
            key={item.store.id}
            type="button"
            onClick={() => onSelect(item.store.id, item.store.name)}
            className={`flex w-full items-center gap-3 px-5 py-4 text-left ${
              index < stores.length - 1 ? 'border-b border-gray-100' : ''
            } ${selected || wasLastUsed ? 'bg-gray-50' : ''}`}
          >
            <StoreAvatar store={item.store} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-ink">{item.store.name}</p>
              <p className="mt-0.5 truncate text-[13px] text-gray-500">{host}</p>
              {wasLastUsed ? (
                <p className="mt-1 text-[11px] font-medium text-gray-400">Last opened</p>
              ) : null}
            </div>
            <RoleBadge role={item.role} />
            {selected ? (
              <MenuIcon name="check-circle" className="h-[18px] w-[18px] text-brand-green" />
            ) : (
              <MenuIcon name="chevron-right" className="h-3 w-3 text-gray-400" />
            )}
          </button>
        )
      })}
    </div>
  )
}
