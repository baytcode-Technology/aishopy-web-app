'use client'

import { ProductVariantOptionsManager } from '@/components/catalog/ProductVariantOptionsManager'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/core/lib/api-error'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import {
  diffVariants,
  hydrateVariantEditorState,
  type GeneratedVariant,
  type VariantOption,
} from '@/core/lib/variant-options'
import { persistVariantChanges } from '@/core/lib/variant-persist'
import type { Product, ProductVariant } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  product: Product | null
  variants: ProductVariant[]
  onClose: () => void
  onSaved: () => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function ManageVariantOptionsModal({
  open,
  product,
  variants: initialVariants,
  onClose,
  onSaved,
  onMessage,
}: Props) {
  const [options, setOptions] = useState<VariantOption[]>([])
  const [generated, setGenerated] = useState<GeneratedVariant[]>([])
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    const state = hydrateVariantEditorState(initialVariants)
    setOptions(state.options)
    setGenerated(state.generated)
  }, [open, initialVariants])

  const validate = (): boolean => {
    for (const v of generated) {
      if (!v.name.trim()) {
        onMessage('err', 'Each variant needs a name')
        return false
      }
      if (parseOptionalPrice(v.compareAtPrice) === undefined) {
        onMessage('err', `Invalid compare at price for ${v.name}`)
        return false
      }
    }
    return true
  }

  const save = async () => {
    if (!product) return
    if (!validate()) return
    setLoading(true)
    try {
      const result = await persistVariantChanges({
        productId: product.id,
        storeId: product.store_id,
        generated,
        initialVariants,
        uploadImages: uploadProductImages,
      })
      const parts: string[] = []
      if (result.created) parts.push(`${result.created} added`)
      if (result.updated) parts.push(`${result.updated} updated`)
      if (result.deleted) parts.push(`${result.deleted} removed`)
      onMessage('ok', parts.length ? `Variants saved (${parts.join(', ')})` : 'Variants saved')
      onSaved()
      onClose()
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not save variants'))
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  const handleSave = () => {
    if (!validate()) return
    const { toDelete } = diffVariants(generated, initialVariants)
    if (toDelete.length > 0) {
      setConfirmDelete(true)
      return
    }
    void save()
  }

  return (
    <>
      <Modal
        open={open}
        title="Manage options"
        onClose={onClose}
        footer={<Button label="Save changes" loading={loading} onClick={handleSave} />}
      >
        <ProductVariantOptionsManager
          existingVariants={initialVariants}
          options={options}
          generatedVariants={generated}
          onChange={(nextOptions, nextGenerated) => {
            setOptions(nextOptions)
            setGenerated(nextGenerated)
          }}
        />
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        title="Remove variants?"
        message="Removing option values will delete variants that use them. Continue?"
        confirmLabel="Save changes"
        loading={loading}
        onConfirm={() => void save()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
