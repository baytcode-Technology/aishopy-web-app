'use client'

import { Button } from '@/components/ui/Button'
import {
  generateVariantsFromOptions,
  type GeneratedVariant,
  type VariantOption,
} from '@/core/lib/variant-options'
import { useMemo, useState } from 'react'

type Props = {
  options: VariantOption[]
  variants: GeneratedVariant[]
  onChange: (options: VariantOption[], variants: GeneratedVariant[]) => void
  showVariantImages?: boolean
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink'
const miniInputClass =
  'w-full rounded-md border border-gray-200 bg-gray-100 px-2 py-1.5 text-[13px] text-ink outline-none focus:border-ink'

export function ShopifyVariantEditor({
  options,
  variants,
  onChange,
  showVariantImages = true,
}: Props) {
  const [expanded, setExpanded] = useState(true)
  const comboCount = useMemo(() => variants.length, [variants.length])

  const addOption = () => {
    onChange([...options, { id: `${Date.now()}`, name: '', values: [''] }], variants)
  }

  const updateOption = (id: string, patch: Partial<VariantOption>) => {
    const nextOptions = options.map((o) => (o.id === id ? { ...o, ...patch } : o))
    onChange(nextOptions, generateVariantsFromOptions(nextOptions, variants))
  }

  const removeOption = (id: string) => {
    const nextOptions = options.filter((o) => o.id !== id)
    onChange(nextOptions, generateVariantsFromOptions(nextOptions, variants))
  }

  const addValue = (optionId: string) => {
    const opt = options.find((o) => o.id === optionId)
    if (!opt) return
    updateOption(optionId, { values: [...opt.values, ''] })
  }

  const setValue = (optionId: string, index: number, value: string) => {
    const opt = options.find((o) => o.id === optionId)
    if (!opt) return
    const values = [...opt.values]
    values[index] = value
    updateOption(optionId, { values })
  }

  const removeValue = (optionId: string, index: number) => {
    const opt = options.find((o) => o.id === optionId)
    if (!opt || opt.values.length <= 1) return
    updateOption(optionId, { values: opt.values.filter((_, i) => i !== index) })
  }

  const updateVariant = (id: string, patch: Partial<GeneratedVariant>) => {
    onChange(
      options,
      variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex items-center justify-between"
      >
        <span className="text-[13px] font-bold text-ink">Options & variants</span>
        <span className="flex items-center gap-2">
          {comboCount > 0 ? (
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
              {comboCount} variants
            </span>
          ) : null}
          <span className="text-[13px] font-bold text-brand-primary">{expanded ? '▴' : '▾'}</span>
        </span>
      </button>

      {expanded ? (
        <>
          <p className="text-xs leading-[18px] text-gray-500">
            Add options (Size, Color), then set price and stock per combination.
          </p>
          {!showVariantImages ? (
            <p className="text-xs leading-[18px] text-gray-500">
              Variant images can be added from product details after the product is created.
            </p>
          ) : null}

          {options.map((opt, optIndex) => (
            <div key={opt.id} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-surface p-3">
              <div className="flex justify-between">
                <p className="text-xs font-bold text-ink">Option {optIndex + 1}</p>
                <button type="button" onClick={() => removeOption(opt.id)} className="text-sm text-gray-500">
                  ⌫
                </button>
              </div>
              <input
                className={inputClass}
                placeholder="e.g. Size"
                value={opt.name}
                onChange={(e) => updateOption(opt.id, { name: e.target.value })}
              />
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">Values</p>
              {opt.values.map((val, vi) => (
                <div key={vi} className="flex items-center gap-2">
                  <input
                    className={`${inputClass} flex-1`}
                    placeholder="e.g. Medium"
                    value={val}
                    onChange={(e) => setValue(opt.id, vi, e.target.value)}
                  />
                  {opt.values.length > 1 ? (
                    <button type="button" onClick={() => removeValue(opt.id, vi)} className="p-1 text-gray-400">
                      −
                    </button>
                  ) : null}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addValue(opt.id)}
                className="flex items-center gap-1.5 text-xs font-semibold text-ink"
              >
                <span className="text-brand-primary">+</span> Add value
              </button>
            </div>
          ))}

          <Button label="Add option" onClick={addOption} className="min-h-0 py-3" />

          {variants.length > 0 ? (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-xs font-bold text-ink">Variant combinations</p>
              {variants.map((v) => (
                <div key={v.id} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-surface p-3">
                  <p className="text-sm font-bold text-ink">{v.name}</p>
                  <div className="flex flex-wrap gap-2">
                    <MiniField
                      label="+Price"
                      value={v.priceDelta}
                      onChange={(priceDelta) => updateVariant(v.id, { priceDelta })}
                    />
                    <MiniField
                      label="Compare at"
                      value={v.compareAtPrice}
                      onChange={(compareAtPrice) => updateVariant(v.id, { compareAtPrice })}
                      placeholder="Optional"
                    />
                    <MiniField
                      label="Stock"
                      value={v.stockQty}
                      onChange={(stockQty) => updateVariant(v.id, { stockQty })}
                    />
                    <MiniField label="SKU" value={v.sku} onChange={(sku) => updateVariant(v.id, { sku })} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function MiniField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="min-w-[30%] flex-1">
      <span className="mb-1 block text-[10px] font-bold text-gray-600">{label}</span>
      <input
        className={miniInputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
