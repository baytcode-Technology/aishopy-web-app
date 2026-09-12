'use client'

import { CreateCategoryModal } from '@/components/catalog/CreateCategoryModal'
import { Button } from '@/components/ui/Button'
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
import { getCategoryBreadcrumb, getDirectChildren } from '@/core/lib/category-tree'
import type { Category } from '@/core/types/category'
import type { Product } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  )
}

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

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [childModalOpen, setChildModalOpen] = useState(false)

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
    () => (category ? getDirectChildren(category.id, categories) : []),
    [category, categories],
  )

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
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update category'))
    } finally {
      setSaving(false)
    }
  }

  const onCoverUpload = async (file: File | null) => {
    if (!category || !store || !file) return
    setSaving(true)
    try {
      const [url] = await uploadProductImages(store.id, [file])
      const res = await updateCategory(category.id, { image_url: url })
      setCategory(res.data)
      setNotice('Cover updated')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not upload cover'))
    } finally {
      setSaving(false)
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

  const removeProduct = async (productId: number) => {
    if (!store || !category) return
    const next = products.filter((item) => item.id !== productId).map((item) => item.id)
    try {
      await syncCategoryProducts(store.id, category.id, next)
      setNotice('Product removed')
      await loadData()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not remove product'))
    }
  }

  const runDelete = async () => {
    if (!category || !window.confirm('Delete this category? Products will be uncategorized.')) return
    try {
      await deleteCategory(category.id)
      router.replace('/products/categories')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not delete category'))
    }
  }

  if (loading) {
    return (
      <main className="px-5 py-10">
        <p className="text-sm font-semibold text-gray-500">Loading category…</p>
      </main>
    )
  }

  if (!category) {
    return (
      <main className="px-5 py-10">
        <p className="text-sm font-semibold text-gray-600">{error ?? 'Category not found'}</p>
        <Link href="/products/categories" className="mt-4 inline-block text-sm font-semibold text-brand-green">
          Back to categories
        </Link>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <Link href="/products/categories" className="text-[13px] font-semibold text-gray-500">
        ← Categories
      </Link>
      <div className="mb-5 mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{category.name}</h1>
          {category.parent_id ? (
            <p className="mt-1 text-[13px] text-gray-500">
              {getCategoryBreadcrumb(category.id, categories)}
            </p>
          ) : null}
        </div>
        <button type="button" onClick={() => void runDelete()} className="text-[13px] font-bold text-[#E11D48]">
          Delete
        </button>
      </div>

      {notice ? <p className="mb-3 text-sm font-semibold text-brand-green">{notice}</p> : null}
      {error ? <p className="mb-3 text-sm text-[#E11D48]">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <Section title="Cover">
          {category.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={category.image_url} alt="" className="mb-3 h-40 w-full rounded-2xl object-cover" />
          ) : (
            <p className="mb-3 text-sm text-gray-400">No cover image</p>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => void onCoverUpload(e.target.files?.[0] ?? null)}
          />
        </Section>

        <Section title="Details">
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
            <Button label="Save details" loading={saving} onClick={() => void saveInfo()} />
          </div>
        </Section>

        <Section title="Subcategories">
          {children.length === 0 ? (
            <p className="mb-3 text-sm text-gray-500">No subcategories yet.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/products/categories/${child.id}`}
                    className="block rounded-xl border border-gray-200 px-3 py-3 font-semibold text-ink"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Button label="Add subcategory" variant="outline" onClick={() => setChildModalOpen(true)} />
        </Section>

        <Section title="Products">
          {products.length === 0 ? (
            <p className="mb-3 text-sm text-gray-500">No products assigned.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3"
                >
                  <Link href={`/products/${product.id}`} className="min-w-0 font-semibold text-ink">
                    {product.name}
                  </Link>
                  <button
                    type="button"
                    className="text-[12px] font-bold text-[#E11D48]"
                    onClick={() => void removeProduct(product.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          <Button label="Assign products" variant="outline" onClick={openAssign} />
        </Section>
      </div>

      {store ? (
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
      ) : null}

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
