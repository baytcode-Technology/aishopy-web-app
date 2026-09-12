'use client'

import { ImagePreviewModal } from '@/components/catalog/ImagePreviewModal'
import { updateCategory } from '@/core/api/categories'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Category } from '@/core/types/category'
import { uploadProductImages } from '@/platform/upload-images'
import { useRef, useState } from 'react'

type Props = {
  category: Category
  storeId: number
  onUpdated: (category: Category) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

function hasCover(url?: string | null) {
  return Boolean(url?.trim())
}

export function CategoryDetailCover({ category, storeId, onUpdated, onMessage }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const replaceImage = async (file: File | null) => {
    if (!file) return
    setBusy(true)
    try {
      const [imageUrl] = await uploadProductImages(storeId, [file])
      const res = await updateCategory(category.id, { image_url: imageUrl })
      onUpdated(res.data)
      onMessage('ok', 'Cover image updated')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not update cover image'))
    } finally {
      setBusy(false)
    }
  }

  const removeImage = async () => {
    setBusy(true)
    try {
      const res = await updateCategory(category.id, { image_url: null })
      onUpdated(res.data)
      onMessage('ok', 'Cover image removed')
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not remove cover image'))
    } finally {
      setBusy(false)
    }
  }

  const cover = hasCover(category.image_url)

  return (
    <>
      <div className="relative mb-4 overflow-hidden rounded-[20px] border border-gray-200 bg-surface">
        {busy ? (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[20px] bg-white/60 text-[12px] font-bold text-ink">
            Saving…
          </div>
        ) : null}

        <div className="px-4 pt-4 pb-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-semibold text-ink">Cover image</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Replace cover image"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-brand-primary"
              >
                ↻
              </button>
              {cover ? (
                <button
                  type="button"
                  aria-label="Remove cover image"
                  disabled={busy}
                  onClick={() => void removeImage()}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-sm text-[#EF4444]"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            disabled={!cover}
            onClick={() => cover && setPreviewOpen(true)}
            className="h-[180px] w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 disabled:cursor-default"
          >
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={category.image_url!} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full flex-col items-center justify-center gap-1 text-[13px] font-medium text-gray-400">
                No cover image
              </span>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null
          e.target.value = ''
          void replaceImage(file)
        }}
      />

      <ImagePreviewModal
        open={previewOpen}
        imageUri={category.image_url}
        title="Cover image"
        onClose={() => setPreviewOpen(false)}
      />
    </>
  )
}
