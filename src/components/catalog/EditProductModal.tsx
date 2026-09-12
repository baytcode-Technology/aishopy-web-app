'use client'

import { CategoryPicker } from '@/components/catalog/CategoryPicker'
import { ProductMediaEditor } from '@/components/catalog/ProductMediaEditor'
import { ProductStatusPicker } from '@/components/catalog/ProductStatusPicker'
import { ProductVariantOptionsManager } from '@/components/catalog/ProductVariantOptionsManager'
import { ShopifyVariantEditor } from '@/components/catalog/ShopifyVariantEditor'
import { VariantInventoryFlagsEditor } from '@/components/catalog/VariantInventoryFlagsEditor'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createProductVariant, updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import {
  productToMediaItems,
  resolveProductMediaForSave,
  resolveThumbnailId,
  type ProductMediaItem,
} from '@/core/lib/product-media'
import { getProductStatus } from '@/core/lib/product-status'
import {
  diffVariants,
  hydrateVariantEditorState,
  toCreateVariantPayload,
  uploadVariantImagesForCreate,
  type GeneratedVariant,
  type VariantOption,
} from '@/core/lib/variant-options'
import { persistVariantChanges } from '@/core/lib/variant-persist'
import type { Category } from '@/core/types/category'
import type { Product, ProductStatus, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  product: Product | null
  variants: ProductVariant[]
  categories: Category[]
  onClose: () => void
  onSaved: () => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function EditProductModal({
  open,
  product,
  variants: initialVariants,
  categories,
  onClose,
  onSaved,
  onMessage,
}: Props) {
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [description, setDescription] = useState('')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState<ProductStatus>('active')
  const [mediaItems, setMediaItems] = useState<ProductMediaItem[]>([])
  const [thumbnailId, setThumbnailId] = useState<string | null>(null)
  const [imageError, setImageError] = useState('')
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([])
  const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[]>([])
  const [markAsSold, setMarkAsSold] = useState(false)
  const [markAsNonInventory, setMarkAsNonInventory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [localError, setLocalError] = useState('')

  const hasExistingVariants = initialVariants.length > 0
  const showProductStock = !hasExistingVariants && generatedVariants.length === 0

  useEffect(() => {
    if (!product || !open) return
    setName(product.name)
    setBasePrice(String(product.base_price))
    setCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : '')
    setStockQty(String(product.stock_qty))
    setDescription(product.description ?? '')
    setSku(product.sku ?? '')
    setCategoryId(product.category_id)
    setStatus(getProductStatus(product))
    const items = productToMediaItems(product)
    setMediaItems(items)
    setThumbnailId(resolveThumbnailId(items, product.thumbnail_url))
    setImageError('')
    setLocalError('')
    if (initialVariants.length > 0) {
      const hydrated = hydrateVariantEditorState(initialVariants)
      setVariantOptions(hydrated.options)
      setGeneratedVariants(hydrated.generated)
    } else {
      setVariantOptions([])
      setGeneratedVariants([])
    }
    setMarkAsSold(product.mark_as_sold ?? false)
    setMarkAsNonInventory(product.mark_as_non_inventory ?? false)
  }, [product, open, initialVariants])

  const validateVariants = (): boolean => {
    for (const v of generatedVariants) {
      if (!v.name.trim()) {
        setLocalError('Each variant needs a name')
        return false
      }
      if (parseOptionalPrice(v.compareAtPrice) === undefined) {
        setLocalError(`Invalid compare at price for ${v.name}`)
        return false
      }
    }
    return true
  }

  const submit = async () => {
    if (!product) return
    setLoading(true)
    try {
      const hasVariants = generatedVariants.length > 0
      const { images, thumbnail_url } = await resolveProductMediaForSave(
        product.store_id,
        mediaItems,
        thumbnailId,
        uploadProductImages,
      )
      await updateProduct(product.id, {
        name: name.trim(),
        base_price: Number(basePrice),
        compare_at_price: parseOptionalPrice(compareAtPrice) ?? null,
        stock_qty: hasVariants ? 0 : Number(stockQty) || 0,
        track_inventory: hasVariants || Number(stockQty) > 0,
        description: description.trim() || null,
        sku: sku.trim() || null,
        category_id: categoryId,
        status,
        is_active: status === 'active',
        images,
        thumbnail_url,
        mark_as_sold: hasVariants ? false : markAsSold,
        mark_as_non_inventory: hasVariants ? false : markAsNonInventory,
      })
      if (hasExistingVariants) {
        await persistVariantChanges({
          productId: product.id,
          storeId: product.store_id,
          generated: generatedVariants,
          initialVariants,
          uploadImages: uploadProductImages,
        })
      } else if (generatedVariants.length > 0) {
        const variantImageUrls = await uploadVariantImagesForCreate(
          product.store_id,
          generatedVariants,
          uploadProductImages,
        )
        for (let i = 0; i < generatedVariants.length; i++) {
          const v = generatedVariants[i]
          await createProductVariant(product.id, {
            ...toCreateVariantPayload(v, variantImageUrls.get(v.id)),
            sort_order: i,
          })
        }
      }
      onMessage('ok', 'Product updated')
      onSaved()
      onClose()
    } catch (e) {
      const message = getErrorMessage(e, 'Could not update product')
      setLocalError(message)
      onMessage('err', message)
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const handleSubmit = async () => {
    if (!product) return
    const price = Number(basePrice)
    const stock = Number(stockQty)
    if (!name.trim()) {
      setLocalError('Product name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setLocalError('Enter a valid price')
      return
    }
    if (parseOptionalPrice(compareAtPrice) === undefined) {
      setLocalError('Compare at price is not valid')
      return
    }
    if (showProductStock && (!Number.isFinite(stock) || stock < 0)) {
      setLocalError('Enter a valid stock quantity')
      return
    }
    if (mediaItems.length === 0) {
      setImageError('At least one product image is required')
      return
    }
    if (!thumbnailId) {
      setImageError('Select a thumbnail image')
      return
    }
    if (!validateVariants()) return
    setLocalError('')
    setImageError('')
    if (hasExistingVariants) {
      const { toDelete } = diffVariants(generatedVariants, initialVariants)
      if (toDelete.length > 0) {
        setConfirmDelete(true)
        return
      }
    }
    await submit()
  }

  return (
    <>
      <Modal
        open={open}
        title="Edit product"
        onClose={onClose}
        footer={<Button label="Save changes" loading={loading} onClick={() => void handleSubmit()} />}
      >
        <div className="flex flex-col gap-4">
          <ProductMediaEditor
            items={mediaItems}
            thumbnailId={thumbnailId}
            onChange={(nextItems, nextThumb) => {
              setMediaItems(nextItems)
              setThumbnailId(nextThumb)
              if (nextItems.length > 0 && nextThumb) setImageError('')
            }}
            error={imageError}
          />
          <Input label="Product name *" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Base price *"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            inputMode="decimal"
          />
          <Input
            label="Compare at price"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            inputMode="decimal"
          />
          {showProductStock ? (
            <Input
              label="Stock quantity"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              inputMode="numeric"
            />
          ) : null}
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <CategoryPicker categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
          />
          <ProductStatusPicker value={status} onChange={setStatus} />
          {showProductStock ? (
            <VariantInventoryFlagsEditor
              markAsSold={markAsSold}
              markAsNonInventory={markAsNonInventory}
              onMarkAsSoldChange={setMarkAsSold}
              onMarkAsNonInventoryChange={setMarkAsNonInventory}
              disabled={loading}
            />
          ) : null}
          {hasExistingVariants ? (
            <ProductVariantOptionsManager
              existingVariants={initialVariants}
              options={variantOptions}
              generatedVariants={generatedVariants}
              onChange={(nextOptions, nextGenerated) => {
                setVariantOptions(nextOptions)
                setGeneratedVariants(nextGenerated)
              }}
            />
          ) : (
            <ShopifyVariantEditor
              options={variantOptions}
              variants={generatedVariants}
              onChange={(nextOptions, nextGenerated) => {
                setVariantOptions(nextOptions)
                setGeneratedVariants(nextGenerated)
              }}
            />
          )}
          {localError ? <p className="text-sm text-[#E11D48]">{localError}</p> : null}
        </div>
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Remove variants?"
        message="Removing option values will delete variants that use them. Continue?"
        confirmLabel="Save changes"
        loading={loading}
        onConfirm={() => void submit()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
