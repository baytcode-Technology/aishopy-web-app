'use client'

import {
  MAX_PRODUCT_IMAGES,
  productImageLimitMessage,
} from '@/core/lib/product-media'
import { useRef } from 'react'

export type PickedProductImage = {
  id: string
  file: File
  uri: string
}

type Props = {
  images: PickedProductImage[]
  thumbnailId: string | null
  onChange: (images: PickedProductImage[], thumbnailId: string | null) => void
  error?: string
}

export function ProductImagePicker({ images, thumbnailId, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const pickImages = () => {
    const fullMessage = productImageLimitMessage(images.length, 0)
    if (fullMessage) return
    inputRef.current?.click()
  }

  const onFiles = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []).filter((file) => file.type.startsWith('image/'))
    if (selected.length === 0) return

    const limitMessage = productImageLimitMessage(images.length, selected.length)
    const remaining = Math.max(0, MAX_PRODUCT_IMAGES - images.length)
    const allowed = limitMessage ? selected.slice(0, remaining) : selected
    if (allowed.length === 0) return

    const next: PickedProductImage[] = allowed.map((file, index) => ({
      id: `${Date.now()}-${index}-${file.name}`,
      file,
      uri: URL.createObjectURL(file),
    }))
    const merged = [...images, ...next]
    onChange(merged, thumbnailId ?? merged[0]?.id ?? null)
  }

  const removeImage = (id: string) => {
    const removed = images.find((image) => image.id === id)
    if (removed) URL.revokeObjectURL(removed.uri)
    const merged = images.filter((image) => image.id !== id)
    const thumb = thumbnailId === id ? (merged[0]?.id ?? null) : thumbnailId
    onChange(merged, thumb)
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] font-bold tracking-wide text-gray-600">Product images *</p>
      <p className="text-xs text-gray-500">
        Add up to {MAX_PRODUCT_IMAGES} images. Tap an image to set it as thumbnail.
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-1">
        {images.length < MAX_PRODUCT_IMAGES ? (
          <button
            type="button"
            onClick={pickImages}
            className="flex h-[88px] w-[88px] shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-ink"
          >
            <span className="text-2xl font-semibold leading-none text-brand-primary">+</span>
            <span className="text-xs font-semibold text-ink">Add</span>
          </button>
        ) : null}
        {images.map((image) => {
          const isThumb = thumbnailId === image.id
          return (
            <div key={image.id} className="relative h-[88px] w-[88px] shrink-0">
              <button
                type="button"
                onClick={() => onChange(images, image.id)}
                className={`relative h-[88px] w-[88px] overflow-hidden rounded-xl border-2 ${
                  isThumb ? 'border-ink' : 'border-transparent'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.uri} alt="" className="h-full w-full object-cover" />
                {isThumb ? (
                  <span className="absolute inset-x-0 bottom-0 bg-ink py-0.5 text-center text-[9px] font-bold uppercase text-white">
                    Thumbnail
                  </span>
                ) : null}
              </button>
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeImage(image.id)}
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
          onFiles(files)
        }}
      />
      {error ? <p className="text-[12px] font-medium text-[#E11D48]">{error}</p> : null}
    </div>
  )
}

export function revokePickedImages(images: PickedProductImage[]) {
  for (const image of images) URL.revokeObjectURL(image.uri)
}
