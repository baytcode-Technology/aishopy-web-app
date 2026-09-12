'use client'

import { ProductStatusPicker } from '@/components/catalog/ProductStatusPicker'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { createProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import type { Category } from '@/core/types/category'
import type { ProductStatus } from '@/core/types/product'
import { uploadProductImages } from '@/platform/upload-images'
import { useEffect, useState, type FormEvent } from 'react'

type Props = {
  open: boolean
  storeId: number
  categories: Category[]
  initialCategoryId?: number
  onClose: () => void
  onCreated: () => void
}

export function CreateProductModal({
  open,
  storeId,
  categories,
  initialCategoryId,
  onClose,
  onCreated,
}: Props) {
  const [name, setName] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [compareAtPrice, setCompareAtPrice] = useState('')
  const [stockQty, setStockQty] = useState('0')
  const [sku, setSku] = useState('')
  const [categoryId, setCategoryId] = useState(
    initialCategoryId != null ? String(initialCategoryId) : '',
  )
  const [status, setStatus] = useState<ProductStatus>('active')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setCategoryId(initialCategoryId != null ? String(initialCategoryId) : '')
  }, [open, initialCategoryId])

  const reset = () => {
    setName('')
    setBasePrice('')
    setCompareAtPrice('')
    setStockQty('0')
    setSku('')
    setCategoryId(initialCategoryId != null ? String(initialCategoryId) : '')
    setStatus('active')
    setDescription('')
    setFiles([])
    setError('')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (event?: FormEvent) => {
    event?.preventDefault()
    const trimmedName = name.trim()
    const price = Number(basePrice)
    const stock = Number(stockQty)
    const compareAt = parseOptionalPrice(compareAtPrice)

    if (!trimmedName) {
      setError('Name is required')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setError(basePrice.trim() ? 'Enter a valid price' : 'Price is required')
      return
    }
    if (compareAt === undefined) {
      setError('Compare-at price must be a valid number')
      return
    }
    if (!Number.isFinite(stock) || stock < 0) {
      setError('Stock must be a valid number')
      return
    }

    setError('')
    setLoading(true)
    try {
      const urls = files.length > 0 ? await uploadProductImages(storeId, files) : []
      await createProduct({
        store_id: storeId,
        name: trimmedName,
        base_price: price,
        compare_at_price: compareAt,
        images: urls,
        thumbnail_url: urls[0] ?? '',
        description: description.trim() || undefined,
        sku: sku.trim() || undefined,
        stock_qty: stock,
        status,
        is_active: status === 'active',
        category_id: categoryId ? Number(categoryId) : undefined,
      })
      reset()
      onCreated()
    } catch (e) {
      setError(getErrorMessage(e, 'Could not create product'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      title="New product"
      onClose={handleClose}
      footer={<Button label="Create product" loading={loading} onClick={() => void onSubmit()} />}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="text-[13px] text-gray-600"
          />
          {files.length > 0 ? (
            <p className="text-[12px] text-gray-500">{files.length} file(s) selected</p>
          ) : null}
        </label>
        <label className="flex w-full flex-col gap-2">
          <span className="text-[13px] font-bold tracking-wide text-gray-600">Category</span>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-[15px] font-medium text-ink outline-none focus:border-ink focus:bg-surface"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <ProductStatusPicker value={status} onChange={setStatus} />
        <Input label="Product name *" value={name} onChange={(e) => setName(e.target.value)} />
        <Input
          label="Base price *"
          value={basePrice}
          onChange={(e) => setBasePrice(e.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Compare at price"
          value={compareAtPrice}
          onChange={(e) => setCompareAtPrice(e.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Stock quantity"
          value={stockQty}
          onChange={(e) => setStockQty(e.target.value)}
          inputMode="numeric"
        />
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          multiline
        />
        {error ? <p className="text-sm text-[#E11D48]">{error}</p> : null}
      </form>
    </Modal>
  )
}
