'use client'

import { CategoryTreeModal } from '@/components/catalog/CategoryTreeModal'
import { getCategoryBreadcrumb } from '@/core/lib/category-tree'
import type { Category } from '@/core/types/category'
import { useState } from 'react'

type Props = {
  categories: Category[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  label?: string
  emptyHint?: string
}

export function CategoryPicker({
  categories,
  selectedId,
  onSelect,
  label = 'Category',
  emptyHint = 'No categories yet — create one first (optional).',
}: Props) {
  const [open, setOpen] = useState(false)

  if (categories.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-bold tracking-wide text-gray-600">{label}</p>
        <p className="pl-1 text-xs text-gray-500">{emptyHint}</p>
      </div>
    )
  }

  const selectedLabel = selectedId ? getCategoryBreadcrumb(selectedId, categories) : 'Uncategorized'

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-bold tracking-wide text-gray-600">{label}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-between rounded-xl border border-gray-200 bg-surface px-4 py-3.5 text-left"
      >
        <span className="pr-3 text-[15px] font-medium text-ink">{selectedLabel}</span>
        <span className="text-[12px] text-gray-400">▾</span>
      </button>
      <CategoryTreeModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        selectedId={selectedId}
        onSelect={onSelect}
        title="Select category"
        subtitle="Choose from your category tree"
        showNoneOption
        noneLabel="Uncategorized"
      />
    </div>
  )
}
