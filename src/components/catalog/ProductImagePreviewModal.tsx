'use client'

import type { ProductMediaItem } from '@/core/lib/product-media'

type Props = {
  open: boolean
  item: ProductMediaItem | null
  onClose: () => void
  onDelete: () => void
  onSetCover?: () => void
}

export function ProductImagePreviewModal({ open, item, onClose, onDelete, onSetCover }: Props) {
  if (!open || !item) return null

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
        <p className="text-base font-bold text-white">Preview</p>
        <span className="w-10" />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.uri} alt="" className="max-h-[520px] w-full object-contain" />
      </div>
      <div className="flex items-center justify-center gap-3 border-t border-white/10 px-4 py-4">
        {onSetCover ? (
          <button type="button" onClick={onSetCover} className="flex min-w-[72px] flex-col items-center">
            <span className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white">
              ★
            </span>
            <span className="text-xs font-semibold text-white">Cover</span>
          </button>
        ) : null}
        <button type="button" onClick={onDelete} className="flex min-w-[72px] flex-col items-center">
          <span className="mb-1.5 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
            ⌫
          </span>
          <span className="text-xs font-semibold text-[#FCA5A5]">Delete</span>
        </button>
      </div>
    </div>
  )
}
