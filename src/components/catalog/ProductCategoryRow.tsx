'use client'

import { CategoryPicker } from '@/components/catalog/CategoryPicker'
import { CreateCategoryModal } from '@/components/catalog/CreateCategoryModal'
import { DetailSection } from '@/components/catalog/DetailSection'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { getCategoryBreadcrumb } from '@/core/lib/category-tree'
import type { Category } from '@/core/types/category'
import type { Product } from '@/core/types/product'
import { useEffect, useState } from 'react'

type Props = {
  product: Product
  storeId: number
  categories: Category[]
  onUpdated: (product: Product) => void
  onCategoriesChange?: (categories: Category[]) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function ProductCategoryRow({
  product,
  storeId,
  categories,
  onUpdated,
  onCategoriesChange,
  onMessage,
}: Props) {
  const [open, setOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(product.category_id)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setSelectedId(product.category_id)
  }, [product.category_id])

  const categoryName = product.category_id
    ? getCategoryBreadcrumb(product.category_id, categories)
    : 'Uncategorized'

  const handleCategoryCreated = async (category?: Category) => {
    setCreateOpen(false)
    if (!category) return
    onCategoriesChange?.([...categories, category])
    setSelectedId(category.id)
    setSaving(true)
    try {
      const res = await updateProduct(product.id, { category_id: category.id })
      onUpdated(res.data)
      onMessage('ok', 'Category created and assigned')
      setOpen(false)
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Category created but could not assign to product'))
    } finally {
      setSaving(false)
    }
  }

  const save = async () => {
    if (selectedId === product.category_id) {
      setOpen(false)
      return
    }
    setSaving(true)
    try {
      const res = await updateProduct(product.id, { category_id: selectedId })
      onUpdated(res.data)
      onMessage('ok', 'Category updated')
      setOpen(false)
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not update category'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <DetailSection className="flex items-center justify-between px-3.5 py-2.5">
        <div className="min-w-0 flex-1 pr-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Category</p>
          <p className="mt-0.5 truncate text-[14px] font-semibold text-ink">{categoryName}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full border border-gray-300 bg-gray-100 px-3 py-1.5 text-[12px] font-bold text-ink"
        >
          Edit
        </button>
      </DetailSection>

      <Modal
        open={open}
        title="Category"
        subtitle="Assign this product to a category"
        onClose={() => {
          if (!saving) setOpen(false)
        }}
        footer={<Button label="Save category" loading={saving} onClick={() => void save()} />}
      >
        <CategoryPicker categories={categories} selectedId={selectedId} onSelect={setSelectedId} />
        <button
          type="button"
          disabled={saving}
          onClick={() => setCreateOpen(true)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-3 text-[13px] font-bold text-ink"
        >
          <span className="text-brand-primary">+</span> Add category
        </button>
      </Modal>

      <CreateCategoryModal
        open={createOpen}
        storeId={storeId}
        categories={categories}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCategoryCreated}
      />
    </>
  )
}
