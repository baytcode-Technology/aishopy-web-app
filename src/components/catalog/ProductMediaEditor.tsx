'use client'

import {
  MAX_PRODUCT_IMAGES,
  mediaId,
  productImageLimitMessage,
  remainingProductImageSlots,
  type ProductMediaItem,
} from '@/core/lib/product-media'
import { useRef } from 'react'

type Props = {
  items: ProductMediaItem[]
  thumbnailId: string | null
  onChange: (items: ProductMediaItem[], thumbnailId: string | null) => void
  error?: string
}

export function ProductMediaEditor({ items, thumbnailId, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pickFiles = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'))
    if (!selected.length) return
    const remaining = remainingProductImageSlots(items.length)
    const allowed = selected.slice(0, remaining)
    if (productImageLimitMessage(items.length, selected.length) && allowed.length === 0) return
    const added: ProductMediaItem[] = allowed.map((file) => ({
      id: mediaId(),
      uri: URL.createObjectURL(file),
      pending: { file, name: file.name, type: file.type || 'image/jpeg' },
    }))
    const merged = [...items, ...added]
    onChange(merged, thumbnailId ?? merged[0]?.id ?? null)
  }

  const removeImage = (id: string) => {
    const merged = items.filter((img) => img.id !== id)
    onChange(merged, thumbnailId === id ? (merged[0]?.id ?? null) : thumbnailId)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-bold tracking-wide text-gray-600">Product images</p>
      <p className="text-xs text-gray-500">
        Add up to {MAX_PRODUCT_IMAGES} images. Tap an image to set it as thumbnail.
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {items.length < MAX_PRODUCT_IMAGES ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink"
          >
            <span className="text-2xl font-semibold text-brand-primary">+</span>
            <span className="text-xs font-semibold text-ink">Add</span>
          </button>
        ) : null}
        {items.map((img) => {
          const isThumb = thumbnailId === img.id
          return (
            <div key={img.id} className="relative h-[88px] w-[88px] shrink-0">
              <button
                type="button"
                onClick={() => onChange(items, img.id)}
                className={`relative h-[88px] w-[88px] overflow-hidden rounded-xl border-2 ${
                  isThumb ? 'border-ink' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.uri} alt="" className="h-full w-full object-cover" />
                {isThumb ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink py-0.5 text-center text-[9px] font-bold uppercase text-white">
                    Thumbnail
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeImage(img.id)}
                className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#EF4444] shadow"
              >
                ✕
              </button>
            </div>
          )
        })}
      </div>
      <input
        ref={inputRef}
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
      {error ? <p className="text-[12px] font-medium text-[#E11D48]">{error}</p> : null}
    </div>
  )
}
