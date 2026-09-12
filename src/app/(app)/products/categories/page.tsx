'use client'

import { CreateCategoryModal } from '@/components/catalog/CreateCategoryModal'
import { PillTabs } from '@/components/catalog/PillTabs'
import { fetchCategories } from '@/core/api/categories'
import { fetchProducts } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  buildCategoryTree,
  defaultExpandedIds,
  filterCategoriesForTree,
  flattenCategoryTree,
  getCategoryBreadcrumb,
} from '@/core/lib/category-tree'
import type { Category } from '@/core/types/category'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type StatusFilter = 'all' | 'active' | 'unlisted'

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'unlisted', label: 'Unlisted' },
]

export default function CategoriesPage() {
  const { store } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const loadData = useCallback(async () => {
    if (!store?.id) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        fetchCategories(store.id),
        fetchProducts(store.id),
      ])
      const products = productsRes.data.products
      const counts = new Map<number, number>()
      for (const product of products) {
        if (product.category_id) {
          counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1)
        }
      }
      const withCounts = categoriesRes.data.categories.map((category) => ({
        ...category,
        product_count: counts.get(category.id) ?? category.product_count ?? 0,
      }))
      setCategories(withCounts)
      setExpandedIds(defaultExpandedIds(buildCategoryTree(withCounts)))
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load categories'))
    } finally {
      setLoading(false)
    }
  }, [store?.id])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredCategories = useMemo(
    () => filterCategoriesForTree(categories, { search, status: statusFilter }),
    [categories, search, statusFilter],
  )

  const isSearching = search.trim().length > 0 || statusFilter !== 'all'

  const tree = useMemo(() => buildCategoryTree(filteredCategories), [filteredCategories])

  const flatItems = useMemo(() => {
    if (isSearching) {
      return filteredCategories
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((category) => ({
          category,
          depth: 0,
          hasChildren: false,
          childCount: 0,
          breadcrumb: getCategoryBreadcrumb(category.id, categories),
        }))
    }
    return flattenCategoryTree(tree, expandedIds).map((item) => ({
      ...item,
      breadcrumb: undefined as string | undefined,
    }))
  }, [isSearching, filteredCategories, tree, expandedIds, categories])

  const rootCount = useMemo(() => categories.filter((c) => !c.parent_id).length, [categories])

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <Link href="/products" className="text-[13px] font-semibold text-gray-500">
        ← Products
      </Link>
      <div className="mb-5 mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-gray-500">
            {rootCount} top-level · {categories.length} total
          </p>
        </div>
        {store ? (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="hidden rounded-full bg-brand-primary px-4 py-2.5 text-[12px] font-bold text-brand-on-primary sm:inline-flex"
          >
            New category
          </button>
        ) : null}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search categories…"
        className="mb-3 w-full rounded-2xl border border-gray-200 bg-surface px-4 py-3 text-[15px] outline-none focus:border-ink"
      />
      <PillTabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />

      {error ? <p className="mt-4 text-sm text-[#E11D48]">{error}</p> : null}

      {loading ? (
        <p className="mt-8 text-sm font-semibold text-gray-500">Loading categories…</p>
      ) : !store ? (
        <p className="mt-8 text-sm text-gray-500">No store selected.</p>
      ) : categories.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-gray-300 bg-surface px-6 py-12 text-center">
          <p className="text-base font-semibold text-ink">No categories yet</p>
          <p className="mt-2 text-sm text-gray-500">Group products with a category tree.</p>
        </div>
      ) : flatItems.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">No categories match this filter.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {flatItems.map((item) => (
            <li key={item.category.id} style={{ paddingLeft: item.depth * 16 }}>
              <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-surface px-3 py-3">
                {item.hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(item.category.id)}
                    className="h-7 w-7 shrink-0 rounded-lg bg-gray-100 text-sm font-bold text-ink"
                    aria-label={expandedIds.has(item.category.id) ? 'Collapse' : 'Expand'}
                  >
                    {expandedIds.has(item.category.id) ? '−' : '+'}
                  </button>
                ) : (
                  <span className="h-7 w-7 shrink-0" />
                )}
                <Link href={`/products/categories/${item.category.id}`} className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{item.category.name}</p>
                  <p className="text-[12px] text-gray-500">
                    {item.breadcrumb && item.breadcrumb !== item.category.name
                      ? `${item.breadcrumb} · `
                      : ''}
                    {item.category.product_count ?? 0} products
                    {item.category.is_active ? '' : ' · Unlisted'}
                  </p>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {store ? (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="fixed bottom-24 right-5 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-2xl font-semibold text-brand-on-primary shadow-lg sm:hidden"
          aria-label="Create category"
        >
          +
        </button>
      ) : null}

      {store ? (
        <CreateCategoryModal
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
