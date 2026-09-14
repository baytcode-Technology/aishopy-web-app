'use client'

import { MenuIcon } from '@/components/ui/MenuIcons'
import { useEffect, useRef } from 'react'

export type PickedLogo = {
  file: File
  previewUrl: string
}

type Props = {
  image: PickedLogo | null
  remoteUrl?: string | null
  storeName?: string
  onChange: (image: PickedLogo | null) => void
  error?: string
  label?: string
  variant?: 'square' | 'round'
}

function initials(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || 'S'
}

export function StoreLogoPicker({
  image,
  remoteUrl,
  storeName = '',
  onChange,
  error,
  label = 'Store logo',
  variant = 'square',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const previewUri = image?.previewUrl ?? remoteUrl ?? null
  const rounded = variant === 'round' ? 'rounded-full' : 'rounded-2xl'

  useEffect(() => {
    return () => {
      if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl)
    }
  }, [image?.previewUrl])

  const pickImage = (file: File | undefined) => {
    if (!file) return
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl)
    onChange({
      file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <p className="text-[13px] font-bold tracking-wide text-gray-600">{label}</p>
      ) : null}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="self-center"
      >
        <div
          className={`flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-dashed ${rounded} ${
            error ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-gray-50'
          }`}
        >
          {previewUri ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUri} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-gray-400">{initials(storeName)}</span>
          )}
        </div>
      </button>
      <p className="text-center text-xs text-gray-500">Tap to choose a logo image</p>
      {image && remoteUrl ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-center text-xs font-semibold text-gray-600 underline"
        >
          Use current logo
        </button>
      ) : null}
      {error ? (
        <p className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-600">
          {error}
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          pickImage(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}

export function StoreLogoEditLink({ onPress }: { onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="mt-2 inline-flex items-center gap-1.5 text-brand-primary"
    >
      <MenuIcon name="pencil" className="h-3 w-3" />
      <span className="text-xs font-bold text-ink">Edit logo</span>
    </button>
  )
}
