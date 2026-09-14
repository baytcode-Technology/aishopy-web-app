'use client'

import { ImagePreviewModal } from '@/components/catalog/ImagePreviewModal'
import { ProductStatusBadge } from '@/components/catalog/ProductStatusBadge'
import { VariantEditModal } from '@/components/catalog/VariantEditModal'
import { VariantImageActionsSheet } from '@/components/catalog/VariantImageActionsSheet'
import { VariantImageTile } from '@/components/catalog/VariantImageTile'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteProductVariant, updateProductVariant } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { formatMoney } from '@/core/lib/format-money'
import {
  getVariantAvailabilityLabel,
  getVariantCardInventoryFlags,
  stockLabelToneClass,
} from '@/core/lib/product-inventory'
import type { Product, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useRef, useState } from 'react'

type Props = {
  variant: ProductVariant
  product: Product
  currency?: string
  onUpdated: (variant: ProductVariant) => void
  onDeleted: (variantId: number) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function VariantEditableCard({
  variant,
  product,
  currency,
  onUpdated,
  onDeleted,
  onMessage,
}: Props) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [optimisticActive, setOptimisticActive] = useState<boolean | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [imageActionsOpen, setImageActionsOpen] = useState(false)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)

  const displayActive = optimisticActive ?? variant.is_active
  const status = displayActive ? 'active' : 'unlisted'
  const cardLocked = busy || deleteLoading || imageBusy
  const unitPrice = Number(product.base_price) + Number(variant.price_delta)
  const availabilityLabel = getVariantAvailabilityLabel(product, variant)
  const { showSoldOut, showNonInventory } = getVariantCardInventoryFlags(product, variant)
  const optionLabels = Object.entries(variant.options ?? {})
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ')

  const toggleActive = async () => {
    if (cardLocked) return
    const next = !variant.is_active
    setBusy(true)
    setOptimisticActive(next)
    try {
      const res = await updateProductVariant(product.id, variant.id, { is_active: next })
      onUpdated(res.data.variant)
      onMessage('ok', next ? 'Variant is active' : 'Variant is unlisted')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not update variant status'))
    } finally {
      setOptimisticActive(null)
      setBusy(false)
    }
  }

  const persistImage = async (image_url: string | null) => {
    setImageBusy(true)
    try {
      const res = await updateProductVariant(product.id, variant.id, { image_url })
      onUpdated(res.data.variant)
      onMessage('ok', image_url ? 'Variant image updated' : 'Variant image removed')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not update variant image'))
    } finally {
      setImageBusy(false)
    }
  }

  const handlePickImage = async (file: File) => {
    if (cardLocked) return
    setImageBusy(true)
    try {
      const [image_url] = await uploadProductImages(product.store_id, [file])
      if (!image_url) throw new Error('Upload failed')
      const res = await updateProductVariant(product.id, variant.id, { image_url })
      onUpdated(res.data.variant)
      onMessage('ok', 'Variant image updated')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not update variant image'))
    } finally {
      setImageBusy(false)
    }
  }

  const runDelete = async () => {
    setDeleteLoading(true)
    try {
      await deleteProductVariant(product.id, variant.id)
      setDeleteOpen(false)
      onDeleted(variant.id)
      onMessage('ok', 'Variant deleted')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not delete variant'))
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      <div className="relative mt-3 overflow-hidden rounded-2xl border border-gray-200 bg-surface p-4">
        {busy || imageBusy ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/60 text-[12px] font-bold text-ink">
            Saving…
          </div>
        ) : null}

        <div className="mb-2 flex items-start gap-2.5">
          <VariantImageTile
            imageUri={variant.image_url}
            size={44}
            loading={imageBusy}
            disabled={cardLocked}
            onPick={handlePickImage}
            onImagePress={variant.image_url ? () => setImageActionsOpen(true) : undefined}
          />
          <p className="min-w-0 flex-1 pt-0.5 pr-2 text-base font-extrabold text-ink">{variant.name}</p>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <ProductStatusBadge status={status} />
              <button
                type="button"
                role="switch"
                aria-checked={displayActive}
                aria-label={displayActive ? 'Disable variant' : 'Enable variant'}
                disabled={cardLocked}
                onClick={() => void toggleActive()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface disabled:opacity-45"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="currentColor"
                  aria-hidden
                  style={{ color: displayActive ? '#3EB056' : '#A1A1AA' }}
                >
                  {displayActive ? (
                    <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                  ) : (
                    <path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zM7 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                  )}
                </svg>
              </button>
            </div>
            {showSoldOut || showNonInventory ? (
              <div className="flex flex-col items-end gap-0.5">
                {showSoldOut ? <p className="text-[11px] font-bold text-[#991B1B]">Sold out</p> : null}
                {showNonInventory ? <p className="text-[11px] font-bold text-brand-green">Non inventory</p> : null}
              </div>
            ) : null}
          </div>
        </div>

        {optionLabels ? <p className="mb-3 text-[12px] text-gray-500">{optionLabels}</p> : null}

        <div className="flex flex-wrap items-center gap-3 pr-[4.75rem]">
          <p className="text-[13px] font-extrabold tracking-tight text-ink">
            {variant.compare_at_price != null && variant.compare_at_price > 0 ? (
              <span className="mr-2 text-[12px] font-bold text-gray-400 line-through">
                {formatMoney(variant.compare_at_price, currency)}
              </span>
            ) : null}
            {formatMoney(unitPrice, currency)}
          </p>
          {availabilityLabel ? (
            <p className={`text-[13px] font-bold ${stockLabelToneClass(availabilityLabel.tone)}`}>
              {availabilityLabel.text}
            </p>
          ) : null}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <button
            type="button"
            aria-label="Edit variant"
            disabled={cardLocked}
            onClick={() => setEditOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-brand-primary"
          >
            ✎
          </button>
          <button
            type="button"
            aria-label="Delete variant"
            disabled={cardLocked}
            onClick={() => setDeleteOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-[#EF4444]"
          >
            ⌫
          </button>
        </div>
      </div>

      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) void handlePickImage(file)
        }}
      />

      <VariantImageActionsSheet
        open={imageActionsOpen}
        onClose={() => setImageActionsOpen(false)}
        onView={() => setImagePreviewOpen(true)}
        onReplace={() => replaceRef.current?.click()}
        onRemove={() => void persistImage(null)}
      />

      <ImagePreviewModal
        open={imagePreviewOpen}
        imageUri={variant.image_url}
        title={variant.name}
        onClose={() => setImagePreviewOpen(false)}
      />

      <VariantEditModal
        open={editOpen}
        mode="edit"
        variant={variant}
        product={product}
        currency={currency}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
        onMessage={onMessage}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete variant"
        message={`Remove "${variant.name}" from this product? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setDeleteOpen(false)
        }}
        onConfirm={() => void runDelete()}
      />
    </>
  )
}
