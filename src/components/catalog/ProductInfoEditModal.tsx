'use client'

import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { updateProduct } from '@/core/api/products'
import { getErrorMessage } from '@/core/lib/api-error'
import { currencySymbol } from '@/core/lib/format-money'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import type { Product } from '@/core/types/product'
import { useEffect, useState, type ReactNode } from 'react'

type Props = {
  open: boolean
  product: Product
  variantCount: number
  currency?: string
  onClose: () => void
  onUpdated: (product: Product) => void
  onMessage: (type: 'ok' | 'err', text: string) => void
}

export function ProductInfoEditModal({
  open,
  product,
  variantCount,
  currency,
  onClose,
  onUpdated,
  onMessage,
}: Props) {
  const symbol = currencySymbol(currency)
  const [name, setName] = useState(product.name)
  const [price, setPrice] = useState(String(product.base_price))
  const [compareAtPrice, setCompareAtPrice] = useState(
    product.compare_at_price != null ? String(product.compare_at_price) : '',
  )
  const [stock, setStock] = useState(String(product.stock_qty))
  const [sku, setSku] = useState(product.sku ?? '')
  const [description, setDescription] = useState(product.description ?? '')
  const [saving, setSaving] = useState(false)
  const showStock = variantCount === 0

  useEffect(() => {
    if (!open) return
    setName(product.name)
    setPrice(String(product.base_price))
    setCompareAtPrice(product.compare_at_price != null ? String(product.compare_at_price) : '')
    setStock(String(product.stock_qty))
    setSku(product.sku ?? '')
    setDescription(product.description ?? '')
  }, [open, product])

  const save = async () => {
    const trimmedName = name.trim()
    const priceNum = Number(price)
    const stockNum = Number(stock)
    if (!trimmedName) {
      onMessage('err', 'Product name is required')
      return
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      onMessage('err', 'Enter a valid price')
      return
    }
    const compareNum = parseOptionalPrice(compareAtPrice)
    if (compareNum === undefined) {
      onMessage('err', 'Enter a valid compare at price')
      return
    }
    if (showStock && (!Number.isFinite(stockNum) || stockNum < 0 || !Number.isInteger(stockNum))) {
      onMessage('err', 'Enter a valid stock quantity')
      return
    }
    setSaving(true)
    try {
      const res = await updateProduct(product.id, {
        name: trimmedName,
        base_price: priceNum,
        compare_at_price: compareNum,
        ...(showStock ? { stock_qty: stockNum, track_inventory: true } : {}),
        sku: sku.trim() || null,
        description: description.trim() || null,
      })
      onUpdated(res.data)
      onMessage('ok', 'Product updated')
      onClose()
    } catch (e) {
      onMessage('err', getErrorMessage(e, 'Could not save product'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Edit product"
      subtitle={product.name}
      onClose={() => {
        if (!saving) onClose()
      }}
      footer={<Button label="Save" loading={saving} onClick={() => void save()} />}
    >
      <div className="flex flex-col gap-3.5">
        <Field label="Product name">
          <input
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-lg font-bold text-ink outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />
        </Field>
        <Field label="Price">
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
            <span className="mr-1 text-base font-bold text-ink">{symbol}</span>
            <input
              className="w-full bg-transparent py-3 text-base font-bold text-ink outline-none"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              inputMode="decimal"
              disabled={saving}
            />
          </div>
        </Field>
        <Field label="Compare at price">
          <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 px-3">
            <span className="mr-1 text-base font-bold text-ink">{symbol}</span>
            <input
              className="w-full bg-transparent py-3 text-base font-bold text-ink outline-none"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              inputMode="decimal"
              placeholder="Optional original price"
              disabled={saving}
            />
          </div>
        </Field>
        <div className="flex gap-3">
          {showStock ? (
            <div className="flex-1">
              <Field label="Stock">
                <input
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base font-bold text-ink outline-none"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  inputMode="numeric"
                  disabled={saving}
                />
              </Field>
            </div>
          ) : null}
          <div className="flex-1">
            <Field label="SKU">
              <input
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-base font-bold text-ink outline-none"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                disabled={saving}
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Variants">
              <div className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-center text-base font-extrabold text-ink">
                {variantCount}
              </div>
            </Field>
          </div>
        </div>
        <Field label="Description">
          <textarea
            className="min-h-[88px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-[15px] text-ink outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={saving}
            placeholder="Add a description…"
          />
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      {children}
    </div>
  )
}
