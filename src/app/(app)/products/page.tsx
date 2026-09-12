'use client'

import { CreateProductModal } from '@/components/catalog/CreateProductModal'
import { PillTabs } from '@/components/catalog/PillTabs'
import { ProductStatusBadge } from '@/components/catalog/ProductStatusBadge'
import { fetchCategories } from '@/core/api/categories'
import { fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import { getProductStatus } from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import type { Product, ProductStatus } from '@/core/types/product'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type StatusFilter = 'all' | ProductStatus

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'draft', label: 'Draft' },
  { key: 'unlisted', label: 'Unlisted' },
]

export default function ProductsPage() {
  const { store } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!store?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetchProducts(store.id),
        fetchCategories(store.id),
      ])
      setProducts(productsRes.data.products)
      const counts = new Map<number, number>()
      for (const product of productsRes.data.products) {
        if (product.category_id) {
          counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1)
        }
      }
      setCategories(
        categoriesRes.data.categories.map((category) => ({
          ...category,
          product_count: counts.get(category.id) ?? category.product_count ?? 0,
        })),
      )
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load catalog'))
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((product) => {
      const matchesSearch = !q || product.name.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || getProductStatus(product) === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [products, search, statusFilter])

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            {products.length} products · {categories.length} categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/products/categories"
            className="rounded-full border border-gray-200 bg-surface px-4 py-2.5 text-[12px] font-bold tracking-wide text-ink"
          >
            Categories
          </Link>
          {store ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="hidden rounded-full bg-brand-primary px-4 py-2.5 text-[12px] font-bold text-brand-on-primary sm:inline-flex"
            >
              New product
            </button>
          ) : null}
        </div>
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products…"
        className="mb-3 w-full rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-[15px] outline-none focus:border-ink"
      />
      <PillTabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />

      {error ? <p className="mt-4 text-sm text-[#E11D48]">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm font-semibold text-gray-500">Loading products…</p>
      ) : !store ? (
        <p className="mt-8 text-sm text-gray-500">
          No store selected.{' '}
          <Link href="/create-store" className="font-semibold text-brand-green">
            Create a store
          </Link>
        </p>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
          <p className="text-base font-semibold text-ink">No products yet</p>
          <p className="mt-2 text-sm text-gray-500">Add your first product to start selling.</p>
        </div>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">No products match this filter.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {filtered.map((product) => (
            <li key={product.id}>
              <Link
                href={`/products/${product.id}`}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-surface px-3 py-3 hover:border-ink"
              >
                {product.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.thumbnail_url}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-[11px] font-bold text-gray-400">
                    No img
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{product.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {formatMoney(product.base_price, store.currency)}
                  </p>
                </div>
                <ProductStatusBadge product={product} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {store ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-2xl font-semibold text-brand-on-primary shadow-lg sm:hidden"
          aria-label="Create product"
        >
          +
        </button>
      ) : null}

      {store ? (
        <CreateProductModal
          open={modalOpen}
          storeId={store.id}
          categories={categories}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            void loadData()
          }}
        />
      ) : null}
    </main>
  )
}
