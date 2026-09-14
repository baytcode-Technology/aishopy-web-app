'use client'

import { useRef } from 'react'

type Props = {
  imageUri?: string | null
  size?: number
  loading?: boolean
  disabled?: boolean
  onPick: (file: File) => void
  onRemove?: () => void
  onImagePress?: () => void
}

export function VariantImageTile({
  imageUri,
  size = 44,
  loading,
  disabled,
  onPick,
  onRemove,
  onImagePress,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const radius = size * 0.27

  const openPicker = () => {
    if (disabled || loading) return
    inputRef.current?.click()
  }

  const handleClick = () => {
    if (disabled || loading) return
    if (imageUri && onImagePress) {
      onImagePress()
      return
    }
    openPicker()
  }

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <button
        type="button"
        disabled={disabled || loading}
        aria-label={imageUri ? 'Variant image' : 'Add variant image'}
        onClick={handleClick}
        className="overflow-hidden border border-gray-200 bg-gray-50 disabled:opacity-60"
        style={{ width: size, height: size, borderRadius: radius }}
      >
        {imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUri} alt="" className="h-full w-full object-cover" />
        ) : (
          <span
            className="flex h-full items-center justify-center font-semibold text-gray-400"
            style={{ fontSize: size * 0.4 }}
          >
            +
          </span>
        )}
        {loading ? (
          <span
            className="absolute inset-0 flex items-center justify-center bg-white/70 text-[11px] font-bold text-ink"
            style={{ borderRadius: radius }}
          >
            …
          </span>
        ) : null}
      </button>
      {imageUri && onRemove && !onImagePress && !loading ? (
        <button
          type="button"
          aria-label="Remove image"
          disabled={disabled}
          onClick={onRemove}
          className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-[10px] font-bold text-gray-500"
        >
          ✕
        </button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onPick(file)
        }}
      />
    </div>
  )
}
