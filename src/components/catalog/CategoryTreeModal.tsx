'use client'

import { CategoryTreeRow } from '@/components/catalog/CategoryTreeRow'
import { Modal } from '@/components/ui/Modal'
import {
  buildCategoryTree,
  defaultExpandedIds,
  flattenCategoryTree,
  getDescendantIds,
} from '@/core/lib/category-tree'
import type { Category } from '@/core/types/category'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  categories: Category[]
  selectedId?: number | null
  onSelect: (id: number | null) => void
  title?: string
  subtitle?: string
  showNoneOption?: boolean
  noneLabel?: string
  excludeCategoryId?: number
}

export function CategoryTreeModal({
  open,
  onClose,
  categories,
  selectedId = null,
  onSelect,
  title = 'Select category',
  subtitle = 'Choose a category from your hierarchy',
  showNoneOption = false,
  noneLabel = 'None',
  excludeCategoryId,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const eligible = useMemo(() => {
    if (!excludeCategoryId) return categories
    const excluded = getDescendantIds(excludeCategoryId, categories)
    excluded.add(excludeCategoryId)
    return categories.filter((item) => !excluded.has(item.id))
  }, [categories, excludeCategoryId])

  const tree = useMemo(() => buildCategoryTree(eligible), [eligible])

  useEffect(() => {
    if (open) setExpandedIds(defaultExpandedIds(tree))
  }, [open, tree])

  const flatItems = useMemo(() => flattenCategoryTree(tree, expandedIds), [tree, expandedIds])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Modal open={open} title={title} subtitle={subtitle} onClose={onClose}>
      {showNoneOption ? (
        <button
          type="button"
          onClick={() => {
            onSelect(null)
            onClose()
          }}
          className={`flex w-full items-center justify-between border-b border-gray-200 px-1 py-3.5 text-left ${
            !selectedId ? 'bg-gray-50' : ''
          }`}
        >
          <span className="text-[15px] font-semibold text-ink">{noneLabel}</span>
          {!selectedId ? <span className="text-brand-primary">✓</span> : null}
        </button>
      ) : null}

      {flatItems.length === 0 ? (
        <p className="py-8 text-center text-gray-400">No categories yet</p>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {flatItems.map((item) => (
            <CategoryTreeRow
              key={item.category.id}
              category={item.category}
              depth={item.depth}
              hasChildren={item.hasChildren}
              childCount={item.childCount}
              expanded={expandedIds.has(item.category.id)}
              onToggleExpand={() => toggleExpand(item.category.id)}
              selectionMode
              selected={selectedId === item.category.id}
              onSelect={() => {
                onSelect(item.category.id)
                onClose()
              }}
            />
          ))}
        </div>
      )}
    </Modal>
  )
}
