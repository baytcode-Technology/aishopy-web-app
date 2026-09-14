'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { CreateProductModal } from '@/components/catalog/CreateProductModal'
import { Fab } from '@/components/catalog/Fab'
import { PillTabs } from '@/components/catalog/PillTabs'
import { ProductListRow } from '@/components/catalog/ProductListRow'
import { SearchBar } from '@/components/catalog/SearchBar'
import { ProductListSkeleton } from '@/components/ui/Skeleton'
import { fetchCategories } from '@/core/api/categories'
import { fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
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

  const listHeader = (
    <div className="pb-2">
      <SearchBar value={search} onChange={setSearch} placeholder="Search products…" />
      <div className="px-5">
        <PillTabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />
      </div>
    </div>
  )

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Products"
        subtitle={`${products.length} products · ${categories.length} categories`}
        right={
          <Link
            href="/products/categories"
            className="rounded-full border border-gray-200 bg-surface px-4 py-2.5 text-[12px] font-bold tracking-wide text-ink"
          >
            Categories
          </Link>
        }
      />

      {error ? <p className="px-5 text-sm text-[#E11D48]">{error}</p> : null}

      {loading ? (
        <div className="pt-2">
          {listHeader}
          <div className="px-5">
            <ProductListSkeleton />
          </div>
        </div>
      ) : !store ? (
        <p className="px-5 pt-8 text-sm text-gray-500">
          No store selected.{' '}
          <Link href="/create-store" className="font-semibold text-brand-green">
            Create a store
          </Link>
        </p>
      ) : products.length === 0 ? (
        <div>
          {listHeader}
          <div className="px-7 pb-28 pt-10 text-center">
            <p className="text-base font-semibold text-ink">No products yet</p>
            <p className="mt-2 text-sm text-gray-500">Tap + to add your first product to the catalog.</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div>
          {listHeader}
          <div className="px-7 pb-28 pt-10 text-center">
            <p className="text-base font-semibold text-ink">No matches</p>
            <p className="mt-2 text-sm text-gray-500">Try a different search or status filter.</p>
          </div>
        </div>
      ) : (
        <div className="pb-32 pt-1">
          {listHeader}
          <ul className="px-5">
            {filtered.map((product) => (
              <li key={product.id}>
                <ProductListRow product={product} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {store ? <Fab onClick={() => setModalOpen(true)} label="Create product" /> : null}

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
