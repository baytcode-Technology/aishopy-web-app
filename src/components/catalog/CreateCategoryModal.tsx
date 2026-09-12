'use client'

import { CategoryImagePicker } from '@/components/catalog/CategoryImagePicker'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createCategory } from '@/core/api/categories'
import { getErrorMessage } from '@/core/lib/api-error'
import type { Category } from '@/core/types/category'
import { uploadProductImages } from '@/platform/upload-images'
import { useState, type FormEvent } from 'react'

type Props = {
  open: boolean
  storeId: number
  categories: Category[]
  initialParentId?: number
  onClose: () => void
  onCreated: (category?: Category) => void
}

export function CreateCategoryModal({
  open,
  storeId,
  categories,
  initialParentId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState(initialParentId != null ? String(initialParentId) : '')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setName('')
    setParentId(initialParentId != null ? String(initialParentId) : '')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const imageUrl = file ? (await uploadProductImages(storeId, [file]))[0] : undefined
      const res = await createCategory({
        store_id: storeId,
        name: name.trim(),
        parent_id: parentId ? Number(parentId) : undefined,
        image_url: imageUrl,
      })
      reset()
      onCreated(res.data)
    } catch (e) {
      setError(getErrorMessage(e, 'Could not create category'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="New category"
      onClose={handleClose}
      footer={<Button label="Create category" loading={loading} onClick={() => void onSubmit()} />}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <Input label="Name *" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Parent category</span>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-ink outline-none focus:border-ink"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None (top level)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <CategoryImagePicker
          imageUri={previewUrl}
          onPick={(next) => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setFile(next)
            setPreviewUrl(URL.createObjectURL(next))
          }}
          onRemove={() => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
            setFile(null)
            setPreviewUrl(null)
          }}
          label="Cover image"
        />
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      </form>
    </Modal>
  )
}
