'use client'

import { useRef } from 'react'

type Props = {
  imageUri?: string | null
  onPick: (file: File) => void
  onRemove?: () => void
  label?: string
}

export function CategoryImagePicker({
  imageUri,
  onPick,
  onRemove,
  label = 'Category image',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col gap-2">
      {label ? <p className="text-[13px] font-bold tracking-wide text-gray-600">{label}</p> : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-44 w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50"
      >
        {imageUri ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUri} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="px-4 text-center text-[13px] text-gray-400">
            Tap to add cover image (optional)
          </span>
        )}
      </button>
      {imageUri && onRemove ? (
        <button type="button" onClick={onRemove} className="text-left text-xs font-semibold text-gray-600 underline">
          Remove image
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
