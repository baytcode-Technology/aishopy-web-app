'use client'

import { DetailSection } from '@/components/catalog/DetailSection'
import { VariantEditableCard } from '@/components/catalog/VariantEditableCard'
import { VariantEditModal } from '@/components/catalog/VariantEditModal'
import { Button } from '@/components/ui/Button'
import type { Product, ProductVariant } from '@/core/types/product'
import { useState } from 'react'

type Props = {
  product: Product
  variants: ProductVariant[]
  currency?: string
  onVariantUpdated: (variant: ProductVariant) => void
  onVariantDeleted: (variantId: number) => void
  onVariantCreated: (variant: ProductVariant) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function ProductVariantsSection({
  product,
  variants,
  currency,
  onVariantUpdated,
  onVariantDeleted,
  onVariantCreated,
  onMessage,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  if (variants.length === 0) {
    return (
      <DetailSection className="p-3.5">
        <p className="mb-1 text-[13px] font-bold text-ink">Variants</p>
        <p className="mb-3 text-[13px] text-gray-500">No variants — single SKU product.</p>
        <Button label="Add variant" variant="outline" onClick={() => setAddOpen(true)} />
        <VariantEditModal
          open={addOpen}
          mode="add"
          variant={null}
          product={product}
          currency={currency}
          onClose={() => setAddOpen(false)}
          onSaved={onVariantCreated}
          onMessage={onMessage}
        />
      </DetailSection>
    )
  }

  return (
    <DetailSection>
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-3.5 py-2.5"
      >
        <span className="text-[13px] font-bold text-ink">Variants · {variants.length}</span>
        <span className="text-[13px] font-bold text-brand-primary">{expanded ? '▾' : '▸'}</span>
      </button>

      <div className="px-3.5 pb-3">
        <Button label="Add variant" variant="outline" onClick={() => setAddOpen(true)} />
      </div>

      {expanded ? (
        <div className="border-t border-gray-200 bg-gray-100 px-3.5 pb-3">
          {variants.map((variant) => (
            <VariantEditableCard
              key={variant.id}
              variant={variant}
              product={product}
              currency={currency}
              onUpdated={onVariantUpdated}
              onDeleted={onVariantDeleted}
              onMessage={onMessage}
            />
          ))}
        </div>
      ) : null}

      <VariantEditModal
        open={addOpen}
        mode="add"
        variant={null}
        product={product}
        currency={currency}
        onClose={() => setAddOpen(false)}
        onSaved={(variant) => {
          onVariantCreated(variant)
          setExpanded(true)
        }}
        onMessage={onMessage}
      />
    </DetailSection>
  )
}
