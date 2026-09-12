'use client'

import { CatalogHeader } from '@/components/catalog/CatalogHeader'
import { CategoryTreeRow } from '@/components/catalog/CategoryTreeRow'
import { CreateCategoryModal } from '@/components/catalog/CreateCategoryModal'
import { Fab } from '@/components/catalog/Fab'
import { PillTabs } from '@/components/catalog/PillTabs'
import { SearchBar } from '@/components/catalog/SearchBar'
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

  const listHeader = (
    <div className="pb-2">
      <SearchBar value={search} onChange={setSearch} placeholder="Search categories…" />
      <div className="px-5">
        <PillTabs tabs={STATUS_TABS} value={statusFilter} onChange={setStatusFilter} />
      </div>
    </div>
  )

  return (
    <main className="min-h-full bg-gray-100">
      <CatalogHeader
        title="Categories"
        subtitle={`${rootCount} top-level · ${categories.length} total`}
        backHref="/products"
      />

      {error ? <p className="px-5 text-sm text-[#E11D48]">{error}</p> : null}

      {loading ? (
        <div className="pt-2">
          {listHeader}
          <p className="px-5 pt-6 text-sm font-semibold text-gray-500">Loading categories…</p>
        </div>
      ) : !store ? (
        <p className="px-5 pt-8 text-sm text-gray-500">No store selected.</p>
      ) : categories.length === 0 ? (
        <div>
          {listHeader}
          <div className="px-7 pb-28 pt-10 text-center">
            <p className="text-base font-semibold text-ink">No categories yet</p>
            <p className="mt-2 text-sm text-gray-500">Tap + to group products with a category tree.</p>
          </div>
        </div>
      ) : flatItems.length === 0 ? (
        <div>
          {listHeader}
          <p className="px-5 pt-8 text-sm text-gray-500">No categories match this filter.</p>
        </div>
      ) : (
        <div className="pb-32 pt-1">
          {listHeader}
          <ul className="px-5">
            {flatItems.map((item) => (
              <li key={item.category.id}>
                <CategoryTreeRow
                  category={item.category}
                  depth={item.depth}
                  hasChildren={item.hasChildren}
                  childCount={item.childCount}
                  expanded={expandedIds.has(item.category.id)}
                  breadcrumb={item.breadcrumb}
                  onToggleExpand={() => toggleExpand(item.category.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      {store ? <Fab onClick={() => setModalOpen(true)} label="Create category" /> : null}

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
