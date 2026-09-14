'use client'

import { DetailHeader } from '@/components/catalog/DetailHeader'
import { DetailSection } from '@/components/catalog/DetailSection'
import { EditProductModal } from '@/components/catalog/EditProductModal'
import { ProductCategoryRow } from '@/components/catalog/ProductCategoryRow'
import { ProductDetailMediaSection } from '@/components/catalog/ProductDetailMediaSection'
import { ProductInfoEditModal } from '@/components/catalog/ProductInfoEditModal'
import { ProductStatusPicker } from '@/components/catalog/ProductStatusPicker'
import { ProductVariantsSection } from '@/components/catalog/ProductVariantsSection'
import { ProductDetailSkeleton } from '@/components/ui/Skeleton'
import { fetchCategories } from '@/core/api/categories'
import { fetchProduct, updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import { getProductStockDisplayValue } from '@/core/lib/product-inventory'
import { getProductStatus } from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import type { Product, ProductStatus, ProductVariant } from '@/core/types/product'
import { useStore } from '@/providers/store-provider'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>()
  const id = Number(params.id)
  const { store } = useStore()
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fullEditOpen, setFullEditOpen] = useState(false)
  const [infoEditOpen, setInfoEditOpen] = useState(false)

  const load = useCallback(async () => {
    if (!Number.isFinite(id)) return
    setLoading(true)
    setError(null)
    try {
      const [res, cats] = await Promise.all([
        fetchProduct(id, store?.id),
        store?.id ? fetchCategories(store.id) : Promise.resolve(null),
      ])
      setProduct(res.data.product)
      setVariants(res.data.variants)
      if (cats) setCategories(cats.data.categories)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not load product'))
    } finally {
      setLoading(false)
    }
  }, [id, store?.id])

  useEffect(() => {
    void load()
  }, [load])

  const flash = (message: string) => {
    setNotice(message)
    setError(null)
  }

  const onMessage = (type: 'ok' | 'err', text: string) => {
    if (type === 'ok') flash(text)
    else {
      setError(text)
      setNotice(null)
    }
  }

  const persist = async (payload: Parameters<typeof updateProduct>[1]) => {
    if (!product) return
    setSaving(true)
    try {
      const res = await updateProduct(product.id, payload)
      setProduct(res.data)
      flash('Saved')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not update product'))
    } finally {
      setSaving(false)
    }
  }

  const onStatusChange = async (next: ProductStatus) => {
    if (!product || getProductStatus(product) === next) return
    await persist({ status: next, is_active: next === 'active' })
  }

  const persistInventoryFlags = async (sold: boolean, nonInventory: boolean) => {
    await persist({
      mark_as_sold: sold,
      mark_as_non_inventory: nonInventory,
    })
  }

  if (loading) {
    return <ProductDetailSkeleton />
  }

  if (!product) {
    return (
      <main className="bg-gray-100 px-5 py-10">
        <p className="text-sm font-semibold text-gray-600">{error ?? 'Product not found'}</p>
      </main>
    )
  }

  const currency = store?.currency

  return (
    <main className="min-h-full bg-gray-100 pb-10">
      <DetailHeader
        title={product.name}
        backHref="/products"
        right={
          <button
            type="button"
            aria-label="Edit product"
            onClick={() => setFullEditOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
          >
            ✎
          </button>
        }
      />

      <div className="flex flex-col gap-3 px-5 pt-4">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        {store ? (
          <ProductDetailMediaSection
            product={product}
            storeId={store.id}
            onProductUpdated={setProduct}
            onMessage={onMessage}
          />
        ) : null}

        {store ? (
          <ProductCategoryRow
            product={product}
            storeId={store.id}
            categories={categories}
            onUpdated={setProduct}
            onCategoriesChange={setCategories}
            onMessage={onMessage}
          />
        ) : null}

        <DetailSection className="p-3">
          <ProductStatusPicker
            value={getProductStatus(product)}
            onChange={(next) => void onStatusChange(next)}
            disabled={saving}
            compact
          />
        </DetailSection>

        <DetailSection className="relative p-3.5">
          <button
            type="button"
            aria-label="Edit product details"
            onClick={() => setInfoEditOpen(true)}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-sm"
          >
            ✎
          </button>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-gray-500">
            Product details
          </p>
          <p className="mb-1 pr-9 text-[17px] font-extrabold leading-tight tracking-tight text-ink">
            {product.name}
          </p>
          <p className="mb-2.5 text-[15px] font-semibold text-ink">
            {formatMoney(product.base_price, currency)}
            {product.compare_at_price != null ? (
              <span className="ml-2 text-[13px] font-medium text-gray-400 line-through">
                {formatMoney(product.compare_at_price, currency)}
              </span>
            ) : null}
          </p>
          <div className="mb-2.5 flex gap-2">
            <InfoStat label="Stock" value={getProductStockDisplayValue(product)} />
            <InfoStat label="SKU" value={product.sku ?? '—'} />
            <InfoStat label="Variants" value={String(variants.length)} />
          </div>
          {product.description ? (
            <p className="text-[13px] leading-5 text-gray-600">{product.description}</p>
          ) : (
            <p className="text-[13px] text-gray-400">No description</p>
          )}
        </DetailSection>

        {variants.length === 0 ? (
          <DetailSection className="p-3.5">
            <p className="mb-2.5 text-[13px] font-bold text-ink">Inventory options</p>
            <label className="mb-2 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span>
                <span className="block text-[13px] font-semibold text-ink">Mark as sold</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                  Shows as sold with 0 stock. Offline orders still allowed.
                </span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={product.mark_as_sold ?? false}
                onChange={(e) => {
                  const sold = e.target.checked
                  void persistInventoryFlags(sold, sold ? false : (product.mark_as_non_inventory ?? false))
                }}
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
              <span>
                <span className="block text-[13px] font-semibold text-ink">Mark as non-inventory</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-gray-500">
                  Unlimited orders. Stock is not updated on checkout.
                </span>
              </span>
              <input
                type="checkbox"
                className="h-5 w-5"
                checked={product.mark_as_non_inventory ?? false}
                onChange={(e) => {
                  const nonInventory = e.target.checked
                  void persistInventoryFlags(nonInventory ? false : (product.mark_as_sold ?? false), nonInventory)
                }}
              />
            </label>
          </DetailSection>
        ) : null}

        <ProductVariantsSection
          product={product}
          variants={variants}
          currency={currency}
          onVariantUpdated={(variant) => {
            setVariants((prev) => prev.map((item) => (item.id === variant.id ? variant : item)))
          }}
          onVariantDeleted={(variantId) => {
            setVariants((prev) => prev.filter((item) => item.id !== variantId))
          }}
          onOptionsSaved={() => void load()}
          onMessage={onMessage}
        />
      </div>

      <EditProductModal
        open={fullEditOpen}
        product={product}
        variants={variants}
        categories={categories}
        onClose={() => setFullEditOpen(false)}
        onSaved={() => void load()}
        onMessage={onMessage}
      />

      <ProductInfoEditModal
        open={infoEditOpen}
        product={product}
        variantCount={variants.length}
        currency={currency}
        onClose={() => setInfoEditOpen(false)}
        onUpdated={setProduct}
        onMessage={onMessage}
      />
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
