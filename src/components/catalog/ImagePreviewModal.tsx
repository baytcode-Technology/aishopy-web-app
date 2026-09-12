'use client'

type Props = {
  open: boolean
  imageUri?: string | null
  title?: string
  onClose: () => void
}

export function ImagePreviewModal({ open, imageUri, title = 'Preview', onClose }: Props) {
  if (!open || !imageUri) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          aria-label="Close preview"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white"
        >
          ✕
        </button>
        <p className="text-[16px] font-bold text-white">{title}</p>
        <span className="w-10" />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUri} alt="" className="max-h-[520px] w-full object-contain" />
      </div>
    </div>
  )
}
