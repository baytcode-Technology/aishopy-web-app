'use client'

import { ProductImagePreviewModal } from '@/components/catalog/ProductImagePreviewModal'
import { ProductMediaGalleryModal } from '@/components/catalog/ProductMediaGalleryModal'
import { Button } from '@/components/ui/Button'
import { updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import {
  MAX_PRODUCT_IMAGES,
  mediaId,
  productImageLimitMessage,
  productToMediaItems,
  remainingProductImageSlots,
  resolveProductMediaForSave,
  resolveThumbnailId,
  type ProductMediaItem,
} from '@/core/lib/product-media'
import type { Product } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  product: Product
  storeId: number
  onProductUpdated: (product: Product) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

function mediaSnapshot(items: ProductMediaItem[], thumbnailId: string | null) {
  return JSON.stringify({
    items: items.map((i) => ({
      id: i.id,
      remoteUrl: i.remoteUrl ?? null,
      pending: Boolean(i.pending),
    })),
    thumbnailId,
  })
}

export function ProductDetailMediaSection({ product, storeId, onProductUpdated, onMessage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<ProductMediaItem[]>(() => productToMediaItems(product))
  const [thumbnailId, setThumbnailId] = useState<string | null>(() =>
    resolveThumbnailId(productToMediaItems(product), product.thumbnail_url),
  )
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<ProductMediaItem | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const next = productToMediaItems(product)
    setItems(next)
    setThumbnailId(resolveThumbnailId(next, product.thumbnail_url))
  }, [product.id, product.updated_at, product.images.join('|'), product.thumbnail_url])

  const hasPending = useMemo(() => items.some((i) => i.pending), [items])
  const baselineSnapshot = useMemo(() => {
    const synced = productToMediaItems(product)
    return mediaSnapshot(synced, resolveThumbnailId(synced, product.thumbnail_url))
  }, [product.id, product.updated_at, product.images.join('|'), product.thumbnail_url])
  const isDirty = useMemo(
    () => mediaSnapshot(items, thumbnailId) !== baselineSnapshot,
    [items, thumbnailId, baselineSnapshot],
  )
  const showSaveBar = hasPending || isDirty

  const persistMedia = useCallback(
    async (nextItems: ProductMediaItem[], nextThumbId: string | null) => {
      const { images, thumbnail_url } = await resolveProductMediaForSave(
        storeId,
        nextItems,
        nextThumbId,
        uploadProductImages,
      )
      const res = await updateProduct(product.id, { images, thumbnail_url })
      const synced = productToMediaItems(res.data)
      setItems(synced)
      setThumbnailId(resolveThumbnailId(synced, res.data.thumbnail_url))
      onProductUpdated(res.data)
    },
    [product.id, storeId, onProductUpdated],
  )

  const pickFiles = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'))
    if (!selected.length) return
    const fullMessage = productImageLimitMessage(items.length, selected.length)
    const remaining = remainingProductImageSlots(items.length)
    const allowed = selected.slice(0, remaining)
    if (fullMessage && allowed.length === 0) {
      onMessage('err', fullMessage)
      return
    }
    const added: ProductMediaItem[] = allowed.map((file) => ({
      id: mediaId(),
      uri: URL.createObjectURL(file),
      pending: { file, name: file.name, type: file.type || 'image/jpeg' },
    }))
    const merged = [...items, ...added]
    setItems(merged)
    if (!thumbnailId && merged[0]) setThumbnailId(merged[0].id)
  }

  const cancelPending = () => {
    const synced = productToMediaItems(product)
    setItems(synced)
    setThumbnailId(resolveThumbnailId(synced, product.thumbnail_url))
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-300 bg-surface">
      <div className="px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[15px] font-semibold text-ink">Media ({items.length})</p>
          <button
            type="button"
            onClick={() => setGalleryOpen(true)}
            className="text-[15px] font-semibold text-[#2563EB]"
          >
            View all
          </button>
        </div>
        <div className="flex gap-2.5 overflow-x-auto pr-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPreviewItem(item)}
              className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.uri} alt="" className="h-full w-full object-cover" />
              {item.pending ? (
                <span className="absolute left-1 top-1 rounded bg-orange-500 px-1 py-0.5 text-[8px] font-bold text-white">
                  NEW
                </span>
              ) : null}
              {thumbnailId === item.id ? (
                <span className="absolute inset-x-0 bottom-0 bg-ink/75 py-0.5 text-center text-[7px] font-bold text-white">
                  COVER
                </span>
              ) : null}
            </button>
          ))}
          {items.length < MAX_PRODUCT_IMAGES ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-2xl text-gray-400"
            >
              +
            </button>
          ) : null}
        </div>
      </div>

      {showSaveBar ? (
        <div className="border-t border-gray-100 bg-gray-50 px-4 pb-4 pt-3">
          <p className="mb-3 text-center text-[13px] font-medium text-gray-600">Unsaved media changes</p>
          <div className="flex gap-3">
            <Button label="Cancel" variant="outline" disabled={saving} onClick={cancelPending} />
            <Button
              label="Save"
              loading={saving}
              onClick={() => {
                void (async () => {
                  setSaving(true)
                  try {
                    await persistMedia(items, thumbnailId)
                    onMessage('ok', 'Images saved')
                  } catch (e) {
                    onMessage('err', getErrorMessage(e, 'Could not save images'))
                  } finally {
                    setSaving(false)
                  }
                })()
              }}
            />
          </div>
        </div>
      ) : (
        <div className="pb-1" />
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files
          e.target.value = ''
          pickFiles(files)
        }}
      />

      <ProductMediaGalleryModal
        open={galleryOpen}
        items={items}
        thumbnailId={thumbnailId}
        onClose={() => setGalleryOpen(false)}
        onChange={(next, thumb) => {
          setItems(next)
          setThumbnailId(thumb)
        }}
        onSave={async (next, thumb) => {
          setSaving(true)
          try {
            await persistMedia(next, thumb)
            onMessage('ok', 'Media updated')
          } catch (e) {
            onMessage('err', getErrorMessage(e, 'Could not save media'))
            throw e
          } finally {
            setSaving(false)
          }
        }}
        saving={saving}
        onWarn={(text) => onMessage('err', text)}
      />

      <ProductImagePreviewModal
        open={previewItem != null}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDelete={() => {
          if (!previewItem) return
          if (items.length <= 1) {
            onMessage('err', 'Add another image before removing this one.')
            return
          }
          const next = items.filter((i) => i.id !== previewItem.id)
          let thumb = thumbnailId
          if (thumb === previewItem.id) thumb = next[0]?.id ?? null
          setItems(next)
          setThumbnailId(thumb)
          setPreviewItem(null)
        }}
        onSetCover={() => {
          if (!previewItem) return
          setThumbnailId(previewItem.id)
          setPreviewItem(null)
        }}
      />
    </section>
  )
}
