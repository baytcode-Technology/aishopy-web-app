'use client'

import { DetailSection } from '@/components/catalog/DetailSection'
import { ImagePreviewModal } from '@/components/catalog/ImagePreviewModal'
import { useState } from 'react'

type Props = {
  url: string
}

export function OrderPaymentProofCard({ url }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DetailSection className="p-3.5">
        <div className="mb-2.5">
          <p className="text-[13px] font-bold text-ink">Payment proof</p>
          <p className="text-[12px] text-gray-500">Customer UPI screenshot · tap to enlarge</p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="overflow-hidden rounded-xl border border-gray-200"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Payment proof" className="h-[140px] w-full object-cover" />
        </button>
      </DetailSection>

      <ImagePreviewModal
        open={open}
        imageUri={url}
        title="Payment proof"
        onClose={() => setOpen(false)}
      />
    </>
  )
}
