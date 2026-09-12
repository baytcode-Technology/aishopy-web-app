'use client'

import { ProductStatusBadge } from '@/components/catalog/ProductStatusBadge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { fetchCategories } from '@/core/api/categories'
import {
  createProductVariant,
  deleteProductVariant,
  fetchProduct,
  updateProduct,
  updateProductVariant,
} from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import {
  getProductStatus,
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_STATUS_THEME,
} from '@/core/lib/product-status'
import type { Category } from '@/core/types/category'
import type { Product, ProductStatus, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useStore } from '@/providers/store-provider'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-surface p-4">
      <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {children}
    </section>
  )
}

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

  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [sku, setSku] = useState('')
  const [description, setDescription] = useState('')
  const [stockQty, setStockQty] = useState('')
  const [trackInventory, setTrackInventory] = useState(false)
  const [markAsSold, setMarkAsSold] = useState(false)
  const [markAsNonInventory, setMarkAsNonInventory] = useState(false)

  const [variantModalOpen, setVariantModalOpen] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [variantName, setVariantName] = useState('')
  const [variantDelta, setVariantDelta] = useState('0')
  const [variantStock, setVariantStock] = useState('0')
  const [variantSku, setVariantSku] = useState('')
  const [variantFile, setVariantFile] = useState<File | null>(null)

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
    setStockQty(String(product.stock_qty ?? 0))
    setTrackInventory(product.track_inventory)
    setMarkAsSold(product.mark_as_sold ?? false)
    setMarkAsNonInventory(product.mark_as_non_inventory ?? false)
  }, [product])

  const flash = (message: string) => {
    setNotice(message)
    setError(null)
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
  }

  const onStatusChange = async (next: ProductStatus) => {
    if (!product || getProductStatus(product) === next) return
    await persist({ status: next, is_active: next === 'active' })
  }

  const onCategoryChange = async (value: string) => {
    await persist({ category_id: value ? Number(value) : null })
  }

  const onSaveInventory = async () => {
    const qty = Number(stockQty)
    if (!Number.isFinite(qty) || qty < 0) {
      setError('Stock must be a valid number')
      return
    }
    await persist({
      track_inventory: trackInventory,
      mark_as_sold: markAsSold,
      mark_as_non_inventory: markAsNonInventory,
      stock_qty: qty,
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

  const openNewVariant = () => {
    setEditingVariant(null)
    setVariantName('')
    setVariantDelta('0')
    setVariantStock('0')
    setVariantSku('')
    setVariantFile(null)
    setVariantModalOpen(true)
  }

  const openEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setVariantName(variant.name)
    setVariantDelta(String(variant.price_delta))
    setVariantStock(String(variant.stock_qty))
    setVariantSku(variant.sku ?? '')
    setVariantFile(null)
    setVariantModalOpen(true)
  }

  const saveVariant = async () => {
    if (!product || !store) return
    const delta = Number(variantDelta)
    const stock = Number(variantStock)
    if (!variantName.trim()) {
      setError('Variant name is required')
      return
    }
    if (!Number.isFinite(delta) || !Number.isFinite(stock) || stock < 0) {
      setError('Enter a valid price delta and stock')
      return
    }
    setSaving(true)
    try {
      const imageUrl = variantFile
        ? (await uploadProductImages(store.id, [variantFile]))[0]
        : editingVariant?.image_url
      if (editingVariant) {
        const res = await updateProductVariant(product.id, editingVariant.id, {
          name: variantName.trim(),
          price_delta: delta,
          stock_qty: stock,
          sku: variantSku.trim() || null,
          image_url: imageUrl ?? null,
        })
        setVariants((prev) => prev.map((item) => (item.id === res.data.variant.id ? res.data.variant : item)))
      } else {
        const res = await createProductVariant(product.id, {
          name: variantName.trim(),
          price_delta: delta,
          stock_qty: stock,
          sku: variantSku.trim() || undefined,
          image_url: imageUrl || undefined,
        })
        setVariants((prev) => [...prev, res.data.variant])
      }
      setVariantModalOpen(false)
      flash('Variant saved')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not save variant'))
    } finally {
      setSaving(false)
    }
  }

  const removeVariant = async (variantId: number) => {
    if (!product || !window.confirm('Delete this variant?')) return
    try {
      await deleteProductVariant(product.id, variantId)
      setVariants((prev) => prev.filter((item) => item.id !== variantId))
      flash('Variant deleted')
    } catch (e) {
      setError(getErrorMessage(e, 'Could not delete variant'))
    }
  }

  if (loading) {
    return (
      <main className="px-5 py-10">
        <p className="text-sm font-semibold text-gray-500">Loading product…</p>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="px-5 py-10">
        <p className="text-sm font-semibold text-gray-600">{error ?? 'Product not found'}</p>
        <Link href="/products" className="mt-4 inline-block text-sm font-semibold text-brand-green">
          Back to products
        </Link>
      </main>
    )
  }

  const currency = store?.currency

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-6">
      <Link href="/products" className="text-[13px] font-semibold text-gray-500">
        ← Products
      </Link>
      <div className="mt-3 mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{product.name}</h1>
          <div className="mt-2">
            <ProductStatusBadge product={product} />
          </div>
        </div>
      </div>

      {notice ? <p className="mb-3 text-sm font-semibold text-brand-green">{notice}</p> : null}
      {error ? <p className="mb-3 text-sm text-[#E11D48]">{error}</p> : null}

      <div className="flex flex-col gap-3">
        <Section title="Media">
          <div className="flex flex-wrap gap-3">
            {product.images.map((url) => (
              <div key={url} className="w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-24 w-24 rounded-xl object-cover" />
                <div className="mt-1 flex flex-col gap-1">
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
          </div>
          <label className="mt-3 block text-[13px] font-semibold text-gray-600">
            Upload images
            <input
              type="file"
              accept="image/*"
              multiple
              className="mt-2 block text-[13px]"
              onChange={(e) => void onUploadImages(e.target.files)}
            />
          </label>
        </Section>

        <Section title="Status">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_STATUS_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                disabled={saving}
                onClick={() => void onStatusChange(option)}
                className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${
                  getProductStatus(product) === option ? 'ring-2 ring-ink' : ''
                }`}
                style={{
                  backgroundColor: PRODUCT_STATUS_THEME[option].badgeBg,
                  color: PRODUCT_STATUS_THEME[option].badgeText,
                }}
              >
                {PRODUCT_STATUS_THEME[option].label}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Category">
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
        </Section>

        <Section title="Product details">
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
            <Button label="Save details" loading={saving} onClick={() => void onSaveInfo()} />
          </div>
        </Section>

        {variants.length === 0 ? (
          <Section title="Inventory">
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={trackInventory}
                onChange={(e) => setTrackInventory(e.target.checked)}
              />
              Track inventory
            </label>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={markAsSold}
                onChange={(e) => {
                  setMarkAsSold(e.target.checked)
                  if (e.target.checked) setMarkAsNonInventory(false)
                }}
              />
              Mark as sold
            </label>
            <label className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={markAsNonInventory}
                onChange={(e) => {
                  setMarkAsNonInventory(e.target.checked)
                  if (e.target.checked) setMarkAsSold(false)
                }}
              />
              Non-inventory item
            </label>
            <Input
              label="Stock quantity"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              inputMode="numeric"
            />
            <div className="mt-3">
              <Button label="Save inventory" loading={saving} onClick={() => void onSaveInventory()} />
            </div>
          </Section>
        ) : null}

        <Section title="Variants">
          {variants.length === 0 ? (
            <p className="mb-3 text-sm text-gray-500">No variants yet. Add one if this product has options.</p>
          ) : (
            <ul className="mb-3 flex flex-col gap-2">
              {variants.map((variant) => (
                <li
                  key={variant.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{variant.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatMoney((product.base_price ?? 0) + (variant.price_delta ?? 0), currency)} ·
                      stock {variant.stock_qty}
                      {variant.sku ? ` · ${variant.sku}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="text-[12px] font-bold text-ink"
                      onClick={() => openEditVariant(variant)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="text-[12px] font-bold text-[#E11D48]"
                      onClick={() => void removeVariant(variant.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button label="Add variant" variant="outline" onClick={openNewVariant} />
        </Section>
      </div>

      <Modal
        open={variantModalOpen}
        title={editingVariant ? 'Edit variant' : 'Add variant'}
        onClose={() => setVariantModalOpen(false)}
        footer={<Button label="Save variant" loading={saving} onClick={() => void saveVariant()} />}
      >
        <div className="flex flex-col gap-3">
          <Input label="Name *" value={variantName} onChange={(e) => setVariantName(e.target.value)} />
          <Input
            label="Price delta"
            value={variantDelta}
            onChange={(e) => setVariantDelta(e.target.value)}
            inputMode="decimal"
          />
          <Input
            label="Stock"
            value={variantStock}
            onChange={(e) => setVariantStock(e.target.value)}
            inputMode="numeric"
          />
          <Input label="SKU" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} />
          <label className="flex flex-col gap-2 text-[13px] font-bold text-gray-600">
            Optional image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setVariantFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </Modal>
    </main>
  )
}
