'use client'

import { ProductImagePreviewModal } from '@/components/catalog/ProductImagePreviewModal'
import { Button } from '@/components/ui/Button'
import {
  MAX_PRODUCT_IMAGES,
  mediaId,
  productImageLimitMessage,
  remainingProductImageSlots,
  type ProductMediaItem,
} from '@/core/lib/product-media'
import { useEffect, useMemo, useRef, useState } from 'react'

type Props = {
  open: boolean
  items: ProductMediaItem[]
  thumbnailId: string | null
  onClose: () => void
  onChange: (items: ProductMediaItem[], thumbnailId: string | null) => void
  onSave: (items: ProductMediaItem[], thumbnailId: string | null) => Promise<void>
  saving?: boolean
  onWarn: (text: string) => void
}

export function ProductMediaGalleryModal({
  open,
  items,
  thumbnailId,
  onClose,
  onChange,
  onSave,
  saving,
  onWarn,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState(items)
  const [draftThumb, setDraftThumb] = useState(thumbnailId)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [previewItem, setPreviewItem] = useState<ProductMediaItem | null>(null)
  const [snapshot, setSnapshot] = useState('')

  useEffect(() => {
    if (!open) return
    setDraft(items)
    setDraftThumb(thumbnailId)
    setSelectMode(false)
    setSelectedIds(new Set())
    setSnapshot(JSON.stringify({ items: items.map((i) => i.id), thumbnailId }))
  }, [open, items, thumbnailId])

  const dirty = useMemo(
    () => JSON.stringify({ items: draft.map((i) => i.id), thumbnailId: draftThumb }) !== snapshot,
    [draft, draftThumb, snapshot],
  )

  const pickFiles = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'))
    if (!selected.length) return
    const remaining = remainingProductImageSlots(draft.length)
    const allowed = selected.slice(0, remaining)
    if (productImageLimitMessage(draft.length, selected.length) && allowed.length === 0) {
      onWarn(productImageLimitMessage(draft.length, selected.length) ?? 'Image limit reached')
      return
    }
    const added: ProductMediaItem[] = allowed.map((file, index) => ({
      id: mediaId(),
      uri: URL.createObjectURL(file),
      pending: { file, name: file.name, type: file.type || 'image/jpeg' },
    }))
    const merged = [...draft, ...added]
    setDraft(merged)
    if (!draftThumb && merged[0]) setDraftThumb(merged[0].id)
  }

  const deleteSelected = () => {
    if (selectedIds.size === 0) return
    const next = draft.filter((i) => !selectedIds.has(i.id))
    if (next.length === 0) {
      onWarn('Add another image before removing this one.')
      return
    }
    let thumb = draftThumb
    if (thumb && selectedIds.has(thumb)) thumb = next[0]?.id ?? null
    setDraft(next)
    setDraftThumb(thumb)
    setSelectedIds(new Set())
    setSelectMode(false)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-surface">
        <div className="flex items-center border-b border-gray-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-brand-primary"
          >
            ✕
          </button>
          <p className="mx-2 flex-1 text-center text-[17px] font-bold text-ink">Product media</p>
          <span className="w-10" />
        </div>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <p className="text-[15px] font-semibold text-ink">Media ({draft.length})</p>
          <button
            type="button"
            onClick={() => {
              if (selectMode) {
                setSelectMode(false)
                setSelectedIds(new Set())
              } else {
                setSelectMode(true)
              }
            }}
            className="text-[15px] font-semibold text-[#2563EB]"
          >
            {selectMode ? 'Done' : 'Select'}
          </button>
        </div>
        {selectMode && selectedIds.size > 0 ? (
          <button
            type="button"
            onClick={deleteSelected}
            className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[14px] font-bold text-red-600"
          >
            Delete {selectedIds.size} selected
          </button>
        ) : null}
        <div className="grid flex-1 grid-cols-3 content-start gap-3 overflow-y-auto px-5 py-4">
          {draft.map((item) => {
            const selected = selectedIds.has(item.id)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (selectMode) {
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(item.id)) next.delete(item.id)
                      else next.add(item.id)
                      return next
                    })
                    return
                  }
                  setPreviewItem(item)
                }}
                className={`relative aspect-square overflow-hidden rounded-xl border ${
                  selected ? 'border-2 border-brand-primary' : 'border-gray-200'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.uri} alt="" className="h-full w-full object-cover" />
                {item.pending ? (
                  <span className="absolute left-1 top-1 rounded bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    NEW
                  </span>
                ) : null}
                {draftThumb === item.id && !selectMode ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink/80 py-0.5 text-center text-[8px] font-bold text-white">
                    COVER
                  </span>
                ) : null}
              </button>
            )
          })}
          {draft.length < MAX_PRODUCT_IMAGES ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-500"
            >
              <span className="text-2xl">+</span>
              <span className="text-[11px] font-semibold">Add</span>
            </button>
          ) : null}
        </div>
        {dirty ? (
          <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-3">
            <Button label="Cancel" variant="outline" disabled={saving} onClick={onClose} />
            <Button
              label="Save"
              loading={saving}
              onClick={() => {
                void (async () => {
                  onChange(draft, draftThumb)
                  await onSave(draft, draftThumb)
                  onClose()
                })()
              }}
            />
          </div>
        ) : null}
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
      </div>
      <ProductImagePreviewModal
        open={previewItem != null}
        item={previewItem}
        onClose={() => setPreviewItem(null)}
        onDelete={() => {
          if (!previewItem) return
          if (draft.length <= 1) {
            onWarn('Add another image before removing this one.')
            return
          }
          const next = draft.filter((i) => i.id !== previewItem.id)
          let thumb = draftThumb
          if (thumb === previewItem.id) thumb = next[0]?.id ?? null
          setDraft(next)
          setDraftThumb(thumb)
          setPreviewItem(null)
        }}
        onSetCover={() => {
          if (!previewItem) return
          setDraftThumb(previewItem.id)
          setPreviewItem(null)
        }}
      />
    </>
  )
}
