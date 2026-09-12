'use client'

import { DetailHeader } from '@/components/catalog/DetailHeader'
import { DetailSection } from '@/components/catalog/DetailSection'
import { ProductStatusPicker } from '@/components/catalog/ProductStatusPicker'
import { ProductVariantsSection } from '@/components/catalog/ProductVariantsSection'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { fetchCategories } from '@/core/api/categories'
import { fetchProduct, updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import { getProductStockDisplayValue } from '@/core/lib/product-inventory'
import { getProductStatus } from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import type { Product, ProductStatus, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
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
  const [editOpen, setEditOpen] = useState(false)

  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')

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

  useEffect(() => {
    if (!product) return
    setName(product.name)
    setBasePrice(String(product.base_price))
    setCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : '')
    setSku(product.sku ?? '')
    setDescription(product.description ?? '')
  }, [product])

  const flash = (message: string) => {
    setNotice(message)
    setError(null)
  }

  const onVariantMessage = (type: 'ok' | 'err', text: string) => {
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

  const onSaveInfo = async () => {
    const price = Number(basePrice)
    const compareAt = parseOptionalPrice(compareAtPrice)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setError('Enter a valid price')
      return
    }
    if (compareAt === undefined) {
      setError('Compare-at price must be a valid number')
      return
    }
    await persist({
      name: name.trim(),
      base_price: price,
      compare_at_price: compareAt,
      sku: sku.trim() || null,
      description: description.trim() || null,
    })
    setEditOpen(false)
  }

  const onStatusChange = async (next: ProductStatus) => {
    if (!product || getProductStatus(product) === next) return
    await persist({ status: next, is_active: next === 'active' })
  }

  const onCategoryChange = async (value: string) => {
    await persist({ category_id: value ? Number(value) : null })
  }

  const persistInventoryFlags = async (sold: boolean, nonInventory: boolean) => {
    await persist({
      mark_as_sold: sold,
      mark_as_non_inventory: nonInventory,
    })
  }

  const onUploadImages = async (files: FileList | null) => {
    if (!product || !store || !files?.length) return
    setSaving(true)
    try {
      const urls = await uploadProductImages(store.id, Array.from(files))
      const images = [...product.images, ...urls]
      await persist({
        images,
        thumbnail_url: product.thumbnail_url || urls[0] || '',
      })
    } catch (e) {
      setError(getErrorMessage(e, 'Could not upload images'))
      setSaving(false)
    }
  }

  const onSetThumbnail = async (url: string) => {
    if (!product) return
    await persist({ thumbnail_url: url, images: product.images })
  }

  const onRemoveImage = async (url: string) => {
    if (!product) return
    const images = product.images.filter((item) => item !== url)
    const thumbnail = product.thumbnail_url === url ? (images[0] ?? '') : (product.thumbnail_url ?? '')
    await persist({ images, thumbnail_url: thumbnail })
  }

  if (loading) {
    return (
      <main className="bg-gray-100 px-5 py-10">
        <p className="text-sm font-semibold text-gray-500">Loading product…</p>
      </main>
    )
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
            onClick={() => setEditOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink"
          >
            ✎
          </button>
        }
      />

      <div className="flex flex-col gap-3 px-5 pt-4">
        {notice ? <p className="text-sm font-semibold text-brand-green">{notice}</p> : null}
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}

        <DetailSection className="p-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {product.images.map((url) => (
              <div key={url} className="w-[88px] shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-[88px] w-[88px] rounded-xl object-cover" />
                <div className="mt-1 flex flex-col gap-0.5">
                  <button
                    type="button"
                    className="text-[11px] font-bold text-ink"
                    onClick={() => void onSetThumbnail(url)}
                  >
                    {product.thumbnail_url === url ? 'Thumbnail' : 'Set thumb'}
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-bold text-[#E11D48]"
                    onClick={() => void onRemoveImage(url)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <label className="flex h-[88px] w-[88px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 text-[11px] font-bold text-gray-500">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => void onUploadImages(e.target.files)}
              />
            </label>
          </div>
        </DetailSection>

        <DetailSection className="p-3">
          <ProductStatusPicker
            value={getProductStatus(product)}
            onChange={(next) => void onStatusChange(next)}
            disabled={saving}
            compact
          />
        </DetailSection>

        <DetailSection className="p-3.5">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-500">Category</p>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] font-medium outline-none focus:border-ink"
            value={product.category_id ?? ''}
            onChange={(e) => void onCategoryChange(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </DetailSection>

        <DetailSection className="relative p-3.5">
          <button
            type="button"
            aria-label="Edit product details"
            onClick={() => setEditOpen(true)}
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
          onVariantCreated={(variant) => {
            setVariants((prev) => [...prev, variant])
          }}
          onMessage={onVariantMessage}
        />
      </div>

      <Modal
        open={editOpen}
        title="Edit product"
        onClose={() => setEditOpen(false)}
        footer={<Button label="Save details" loading={saving} onClick={() => void onSaveInfo()} />}
      >
        <div className="flex flex-col gap-3">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Base price"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            inputMode="decimal"
          />
          <Input
            label="Compare-at price"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            inputMode="decimal"
          />
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
          />
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
