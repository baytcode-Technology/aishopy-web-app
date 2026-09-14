'use client'

import { VariantImageTile } from '@/components/catalog/VariantImageTile'
import { VariantInventoryFlagsEditor } from '@/components/catalog/VariantInventoryFlagsEditor'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createProductVariant, updateProductVariant } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { currencySymbol } from '@/core/lib/format-money'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import type { Product, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  mode: 'add' | 'edit'
  variant: ProductVariant | null
  product: Product
  currency?: string
  onClose: () => void
  onSaved: (variant: ProductVariant) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function VariantEditModal({
  open,
  mode,
  variant,
  product,
  currency,
  onClose,
  onSaved,
  onMessage,
}: Props) {
  const symbol = currencySymbol(currency)
  const unitPrice = variant ? Number(product.base_price) + Number(variant.price_delta) : Number(product.base_price)

  const [nameDraft, setNameDraft] = useState('')
  const [priceDraft, setPriceDraft] = useState('')
  const [compareAtPriceDraft, setCompareAtPriceDraft] = useState('')
  const [stockDraft, setStockDraft] = useState('0')
  const [skuDraft, setSkuDraft] = useState('')
  const [markAsSold, setMarkAsSold] = useState(false)
  const [markAsNonInventory, setMarkAsNonInventory] = useState(false)
  const [displayImageUri, setDisplayImageUri] = useState<string | null>(null)
  const [pickedImage, setPickedImage] = useState<File | null>(null)
  const [pickedPreview, setPickedPreview] = useState<string | null>(null)
  const [imageRemoved, setImageRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setNameDraft(variant?.name ?? '')
    setPriceDraft(String(unitPrice || 0))
    setCompareAtPriceDraft(variant?.compare_at_price != null ? String(variant.compare_at_price) : '')
    setStockDraft(String(variant?.stock_qty ?? 0))
    setSkuDraft(variant?.sku ?? '')
    setMarkAsSold(variant?.mark_as_sold ?? false)
    setMarkAsNonInventory(variant?.mark_as_non_inventory ?? false)
    setDisplayImageUri(variant?.image_url ?? null)
    setPickedImage(null)
    setPickedPreview(null)
    setImageRemoved(false)
    setLocalError(null)
  }, [
    open,
    variant?.id,
    variant?.name,
    variant?.compare_at_price,
    variant?.stock_qty,
    variant?.sku,
    variant?.mark_as_sold,
    variant?.mark_as_non_inventory,
    variant?.image_url,
    unitPrice,
  ])

  useEffect(() => {
    return () => {
      if (pickedPreview) URL.revokeObjectURL(pickedPreview)
    }
  }, [pickedPreview])

  const handleClose = () => {
    if (!saving) onClose()
  }

  const save = async () => {
    const price = Number(priceDraft)
    const stock = Number(stockDraft)
    if (mode === 'add' && !nameDraft.trim()) {
      setLocalError('Variant name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setLocalError('Enter a valid price')
      return
    }
    if (!Number.isFinite(stock) || !Number.isInteger(stock) || stock < 0) {
      setLocalError('Enter a valid stock quantity')
      return
    }
    const compareAtPrice = parseOptionalPrice(compareAtPriceDraft)
    if (compareAtPrice === undefined) {
      setLocalError('Enter a valid compare at price')
      return
    }

    const price_delta = price - Number(product.base_price)
    setSaving(true)
    setLocalError(null)
    try {
      let image_url: string | null | undefined
      if (imageRemoved) {
        image_url = null
      } else if (pickedImage) {
        const urls = await uploadProductImages(product.store_id, [pickedImage])
        image_url = urls[0] ?? null
        if (!image_url) throw new Error('Image upload failed')
      }

      if (mode === 'edit' && variant) {
        const res = await updateProductVariant(product.id, variant.id, {
          price_delta,
          compare_at_price: compareAtPrice,
          stock_qty: stock,
          sku: skuDraft.trim() || null,
          ...(image_url !== undefined ? { image_url } : {}),
          mark_as_sold: markAsSold,
          mark_as_non_inventory: markAsNonInventory,
        })
        onSaved(res.data.variant)
        onMessage('ok', 'Variant updated')
      } else {
        const res = await createProductVariant(product.id, {
          name: nameDraft.trim(),
          price_delta,
          compare_at_price: compareAtPrice,
          stock_qty: stock,
          sku: skuDraft.trim() || undefined,
          ...(image_url ? { image_url } : {}),
          mark_as_sold: markAsSold,
          mark_as_non_inventory: markAsNonInventory,
        })
        onSaved(res.data.variant)
        onMessage('ok', 'Variant created')
      }
      onClose()
    } catch (e) {
      const message = getErrorMessage(e, mode === 'edit' ? 'Could not update variant' : 'Could not create variant')
      setLocalError(message)
      onMessage('err', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={mode === 'edit' ? 'Edit variant' : 'Add variant'}
      subtitle={mode === 'edit' ? (variant?.name ?? undefined) : undefined}
      onClose={handleClose}
      footer={<Button label="Save" loading={saving} onClick={() => void save()} />}
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Variant image">
          <VariantImageTile
            imageUri={pickedPreview ?? displayImageUri}
            size={56}
            disabled={saving}
            onPick={(file) => {
              if (pickedPreview) URL.revokeObjectURL(pickedPreview)
              setPickedImage(file)
              setPickedPreview(URL.createObjectURL(file))
              setImageRemoved(false)
            }}
            onRemove={
              pickedPreview || displayImageUri
                ? () => {
                    if (pickedPreview) URL.revokeObjectURL(pickedPreview)
                    setPickedImage(null)
                    setPickedPreview(null)
                    setDisplayImageUri(null)
                    setImageRemoved(true)
                  }
                : undefined
            }
          />
        </Field>

        {mode === 'add' ? (
          <Input label="Name *" value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} />
        ) : null}

        <Field label="Price">
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
            <span className="mr-1 text-base font-bold text-ink">{symbol}</span>
            <input
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              inputMode="decimal"
              disabled={saving}
              className="w-full bg-transparent py-3 text-base font-bold text-ink outline-none"
            />
          </div>
        </Field>

        <Field label="Compare at price">
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
            <span className="mr-1 text-base font-bold text-ink">{symbol}</span>
            <input
              value={compareAtPriceDraft}
              onChange={(e) => setCompareAtPriceDraft(e.target.value)}
              inputMode="decimal"
              disabled={saving}
              placeholder="Optional original price"
              className="w-full bg-transparent py-3 text-base font-bold text-ink outline-none placeholder:font-medium placeholder:text-gray-400"
            />
          </div>
        </Field>

        <Input
          label="Stock"
          value={stockDraft}
          onChange={(e) => setStockDraft(e.target.value)}
          inputMode="numeric"
          disabled={saving}
        />
        <Input
          label="SKU"
          value={skuDraft}
          onChange={(e) => setSkuDraft(e.target.value)}
          disabled={saving}
          placeholder="Optional"
        />

        <Field label="Variant inventory">
          <VariantInventoryFlagsEditor
            markAsSold={markAsSold}
            markAsNonInventory={markAsNonInventory}
            onMarkAsSoldChange={setMarkAsSold}
            onMarkAsNonInventoryChange={setMarkAsNonInventory}
            disabled={saving}
          />
        </Field>

        {localError ? <p className="text-sm text-[#E11D48]">{localError}</p> : null}
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  )
}
