'use client'

import { CategoryDetailCover } from '@/components/catalog/CategoryDetailCover'
import { CategoryTreeModal } from '@/components/catalog/CategoryTreeModal'
import { CategoryTreeRow } from '@/components/catalog/CategoryTreeRow'
import { CreateCategoryModal } from '@/components/catalog/CreateCategoryModal'
import { CreateProductModal } from '@/components/catalog/CreateProductModal'
import { DetailHeader } from '@/components/catalog/DetailHeader'
import { DetailSection } from '@/components/catalog/DetailSection'
import { Fab } from '@/components/catalog/Fab'
import { ProductListRow } from '@/components/catalog/ProductListRow'
import { Button } from '@/components/ui/Button'
import { CategoryDetailSkeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  deleteCategory,
  fetchCategories,
  syncCategoryProducts,
  updateCategory,
} from '@/core/api/categories'
import { fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  getAttachableCategories,
  getCategoryBreadcrumb,
  getDirectChildren,
} from '@/core/lib/category-tree'
import { PRODUCT_STATUS_THEME } from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import type { Product } from '@/core/types/product'
import { useStore } from '@/providers/store-provider'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function CategoryDetailPage() {
  const params = useParams<{ id: string }>()
  const categoryId = Number(params.id)
  const router = useRouter()
  const { store } = useStore()

  const [category, setCategory] = useState<Category | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [childModalOpen, setChildModalOpen] = useState(false)
  const [attachExistingOpen, setAttachExistingOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [removingChildId, setRemovingChildId] = useState<number | null>(null)
  const [productsOpen, setProductsOpen] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadData = useCallback(async () => {
    if (!store?.id || !Number.isFinite(categoryId)) return
    setLoading(true)
    setError(null)
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetchCategories(store.id),
        fetchProducts(store.id),
      ])
      const cats = categoriesRes.data.categories
      const found = cats.find((item) => item.id === categoryId) ?? null
      const all = productsRes.data.products
      const inCategory = all.filter((item) => item.category_id === categoryId)
      if (found) {
        setCategory({ ...found, product_count: inCategory.length })
      } else {
        setCategory(null)
      }
      setCategories(cats)
      setAllProducts(all)
      setProducts(inCategory)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load category'))
    } finally {
      setLoading(false)
    }
  }, [store?.id, categoryId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  useEffect(() => {
    if (!category) return
    setName(category.name)
    setDescription(category.description ?? '')
    setIsActive(category.is_active)
  }, [category])

  const children = useMemo(
    () =>
      (category ? getDirectChildren(category.id, categories) : []).map((child) => ({
        ...child,
        product_count: allProducts.filter((product) => product.category_id === child.id).length,
      })),
    [category, categories, allProducts],
  )

  const attachableCategories = useMemo(
    () => (Number.isFinite(categoryId) ? getAttachableCategories(categoryId, categories) : []),
    [categoryId, categories],
  )

  const onMessage = (type: 'ok' | 'err', text: string) => {
    if (type === 'ok') {
      setNotice(text)
      setError(null)
    } else {
      setError(text)
      setNotice(null)
    }
  }

  const saveInfo = async () => {
    if (!category) return
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    try {
      const res = await updateCategory(category.id, {
        name: name.trim(),
        description: description.trim() || null,
        is_active: isActive,
      })
      setCategory(res.data)
      setNotice('Saved')
      setError(null)
      setEditOpen(false)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update category'))
    } finally {
      setSaving(false)
    }
  }

  const attachExisting = async (childId: number | null) => {
    if (!childId || childId === categoryId) return
    try {
      await updateCategory(childId, { parent_id: categoryId })
      setAttachExistingOpen(false)
      onMessage('ok', 'Subcategory added')
      await loadData()
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not add subcategory'))
    }
  }

  const detachChild = async (childId: number) => {
    setRemovingChildId(childId)
    try {
      await updateCategory(childId, { parent_id: null })
      onMessage('ok', 'Removed from this category')
      await loadData()
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not remove subcategory'))
    } finally {
      setRemovingChildId(null)
    }
  }

  const openAssign = () => {
    setSelectedIds(new Set(products.map((item) => item.id)))
    setAssignOpen(true)
  }

  const saveAssignments = async () => {
    if (!store || !category) return
    setSaving(true)
    try {
      await syncCategoryProducts(store.id, category.id, Array.from(selectedIds))
      setAssignOpen(false)
      setNotice('Products updated')
      await loadData()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not assign products'))
    } finally {
      setSaving(false)
    }
  }

  const runDelete = async () => {
    if (!category) return
    setDeleting(true)
    try {
      await deleteCategory(category.id)
      setDeleteOpen(false)
      router.replace('/products/categories')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not delete category'))
      setDeleting(false)
    }
  }

  if (loading) {
    return <CategoryDetailSkeleton />
  }

  if (!category) {
    return (
      <main className="bg-gray-100 px-5 py-10">
        <p className="text-sm font-semibold text-gray-600">{error ?? 'Category not found'}</p>
      </main>
    )
  }

  const badge = PRODUCT_STATUS_THEME[category.is_active ? 'active' : 'unlisted']

  return (
    <main className="min-h-full bg-gray-100 pb-28">
      <DetailHeader
        title={category.name}
        backHref="/products/categories"
        right={
          <>
            <button
              type="button"
              aria-label="Edit category"
              onClick={() => setEditOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
            >
              ✎
            </button>
            <button
              type="button"
              aria-label="Delete category"
              onClick={() => setDeleteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[#E11D48]"
            >
              ⌫
            </button>
          </>
        }
      />

      <div className="px-5 pt-5">
        {notice ? <p className="mb-3 text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="mb-3 text-sm text-[#E11D48]">{error}</p> : null}

        {store ? (
          <CategoryDetailCover
            category={category}
            storeId={store.id}
            onUpdated={setCategory}
            onMessage={onMessage}
          />
        ) : null}

        <span
          className="mb-4 inline-flex rounded-full px-2.5 py-1 text-[12px] font-semibold"
          style={{ backgroundColor: badge.badgeBg, color: badge.badgeText }}
        >
          {badge.label}
        </span>

        <DetailSection className="relative mb-4 p-4">
          <button
            type="button"
            aria-label="Edit category details"
            onClick={() => setEditOpen(true)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100"
          >
            ✎
          </button>
          <p className="mb-4 pr-10 text-[20px] font-extrabold leading-tight tracking-tighter text-ink">
            {category.name}
          </p>
          <div className="mb-4 flex gap-3">
            <InfoStat
              label="Products"
              value={products.length === 1 ? '1 product' : `${products.length} products`}
            />
            <InfoStat label="Status" value={category.is_active ? 'Active' : 'Unlisted'} />
          </div>
          <p className="mb-2 text-[13px] font-bold text-ink">About</p>
          {category.description?.trim() ? (
            <p className="text-[15px] leading-6 text-gray-600">{category.description}</p>
          ) : (
            <p className="text-[15px] text-gray-400">No description</p>
          )}
        </DetailSection>

        {category.parent_id ? (
          <p className="mb-4 text-[13px] text-gray-500">
            {getCategoryBreadcrumb(category.id, categories)}
          </p>
        ) : null}

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-bold uppercase tracking-wide text-gray-500">Subcategories</p>
            <p className="text-[13px] text-gray-500">{children.length}</p>
          </div>
          {children.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-center">
              <p className="text-[14px] text-gray-500">
                No subcategories yet. Create one, or add an existing category here.
              </p>
              <div className="mt-4 flex flex-col gap-2">
                <Button label="Add subcategory" variant="outline" onClick={() => setChildModalOpen(true)} />
                <Button label="Add existing" variant="outline" onClick={() => setAttachExistingOpen(true)} />
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-gray-200 px-3">
                {children.map((child) => (
                  <div key={child.id} className="flex items-center">
                    <div className="min-w-0 flex-1">
                      <CategoryTreeRow category={child} />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove ${child.name} from parent`}
                      disabled={removingChildId === child.id}
                      onClick={() => void detachChild(child.id)}
                      className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 disabled:opacity-40"
                    >
                      ⤢
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2">
                <Button label="Add subcategory" variant="outline" onClick={() => setChildModalOpen(true)} />
                <Button label="Add existing" variant="outline" onClick={() => setAttachExistingOpen(true)} />
              </div>
            </>
          )}
        </section>

        <section className="-mx-5 mb-6">
          <div className="flex items-center border-y border-gray-100 bg-gray-50">
            <button
              type="button"
              onClick={() => setProductsOpen((value) => !value)}
              className="flex flex-1 items-center justify-between px-5 py-3.5 text-left"
            >
              <span className="text-[15px] font-bold text-ink">Products · {products.length}</span>
              <span className="text-ink">{productsOpen ? '▾' : '▸'}</span>
            </button>
            <button
              type="button"
              onClick={openAssign}
              className="border-l border-gray-100 px-4 py-3.5 text-[12px] font-bold text-ink"
            >
              Add / remove
            </button>
          </div>
          {productsOpen ? (
            <div className="px-5">
              {products.length === 0 ? (
                <p className="py-3 text-sm text-gray-500">No products assigned.</p>
              ) : (
                products.map((product) => <ProductListRow key={product.id} product={product} />)
              )}
            </div>
          ) : null}
        </section>
      </div>

      {store ? (
        <>
          <Fab onClick={() => setProductModalOpen(true)} label="Create product" />
          <CreateProductModal
            open={productModalOpen}
            storeId={store.id}
            categories={categories}
            initialCategoryId={category.id}
            onClose={() => setProductModalOpen(false)}
            onCreated={() => {
              setProductModalOpen(false)
              onMessage('ok', 'Product created')
              void loadData()
            }}
          />
          <CreateCategoryModal
            open={childModalOpen}
            storeId={store.id}
            categories={categories}
            initialParentId={category.id}
            onClose={() => setChildModalOpen(false)}
            onCreated={() => {
              setChildModalOpen(false)
              void loadData()
            }}
          />
          <CategoryTreeModal
            open={attachExistingOpen}
            onClose={() => setAttachExistingOpen(false)}
            categories={attachableCategories}
            selectedId={null}
            onSelect={(id) => void attachExisting(id)}
            title="Add existing category"
            subtitle="Nest another category under this one"
            showNoneOption={false}
          />
        </>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete category"
        message={`Delete "${category.name}"? Products in this category will be removed from it (not deleted).`}
        confirmLabel="Delete category"
        loading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false)
        }}
        onConfirm={() => void runDelete()}
      />

      <Modal
        open={editOpen}
        title="Edit category"
        onClose={() => setEditOpen(false)}
        footer={<Button label="Save details" loading={saving} onClick={() => void saveInfo()} />}
      >
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
          />
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Active
          </label>
        </div>
      </Modal>

      <Modal
        open={assignOpen}
        title="Assign products"
        onClose={() => setAssignOpen(false)}
        footer={<Button label="Save assignments" loading={saving} onClick={() => void saveAssignments()} />}
      >
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {allProducts.length === 0 ? (
            <p className="text-sm text-gray-500">No products in this store.</p>
          ) : (
            allProducts.map((product) => (
              <label key={product.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={(e) => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (e.target.checked) next.add(product.id)
                      else next.delete(product.id)
                      return next
                    })
                  }}
                />
                <span className="text-sm font-semibold text-ink">{product.name}</span>
              </label>
            ))
          )}
        </div>
      </Modal>
    </main>
  )
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-xl bg-gray-50 px-2.5 py-2">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="truncate text-[13px] font-semibold text-ink">{value}</p>
    </div>
  )
}
