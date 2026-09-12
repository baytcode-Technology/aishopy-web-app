'use client'

import { VariantImageTile } from '@/components/catalog/VariantImageTile'
import { Button } from '@/components/ui/Button'
import {
  generateVariantsFromOptions,
  isPersistedVariantId,
  type GeneratedVariant,
  type VariantOption,
} from '@/core/lib/variant-options'
import type { ProductVariant } from '@/core/types/product'
import { useMemo, useState } from 'react'

type Props = {
  existingVariants: ProductVariant[]
  options: VariantOption[]
  generatedVariants: GeneratedVariant[]
  onChange: (options: VariantOption[], generated: GeneratedVariant[]) => void
  showTitle?: boolean
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5 text-[15px] text-ink outline-none focus:border-ink'
const miniInputClass =
  'w-full rounded-md border border-gray-200 bg-gray-100 px-2 py-1.5 text-[13px] text-ink outline-none focus:border-ink'

export function ProductVariantOptionsManager({
  existingVariants,
  options,
  generatedVariants,
  onChange,
  showTitle = true,
}: Props) {
  const [expanded, setExpanded] = useState(true)

  const existingKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const v of existingVariants) {
      const opts = Object.fromEntries(
        Object.entries(v.options ?? {}).map(([k, val]) => [k, String(val)]),
      )
      keys.add(JSON.stringify(opts))
    }
    return keys
  }, [existingVariants])

  const regenerate = (nextOptions: VariantOption[], previous: GeneratedVariant[]) => {
    onChange(nextOptions, generateVariantsFromOptions(nextOptions, previous))
  }

  const addOption = () => {
    regenerate([...options, { id: `${Date.now()}`, name: '', values: [''] }], generatedVariants)
  }

  const updateOption = (id: string, patch: Partial<VariantOption>) => {
    regenerate(
      options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      generatedVariants,
    )
  }

  const removeOption = (id: string) => {
    regenerate(
      options.filter((o) => o.id !== id),
      generatedVariants,
    )
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
      generatedVariants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    )
  }

  const isExistingCombo = (v: GeneratedVariant) =>
    isPersistedVariantId(v.id) || existingKeys.has(JSON.stringify(v.options))

  const newCount = generatedVariants.filter((v) => !isExistingCombo(v)).length

  return (
    <div className="flex flex-col gap-2.5">
      {showTitle ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex items-center justify-between"
        >
          <span className="text-[13px] font-bold text-ink">Options & variants</span>
          <span className="flex items-center gap-2">
            {generatedVariants.length > 0 ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-ink">
                {generatedVariants.length} variants
              </span>
            ) : null}
            {newCount > 0 ? (
              <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">
                {newCount} new
              </span>
            ) : null}
            <span className="text-[13px] font-bold text-brand-primary">{expanded ? '▴' : '▾'}</span>
          </span>
        </button>
      ) : null}

      {expanded || !showTitle ? (
        <>
          <p className="text-xs leading-[18px] text-gray-500">
            Add values to existing options (e.g. L, XL for Size) or add a new option. New combinations
            are created automatically.
          </p>

          {options.map((opt, optIndex) => (
            <div key={opt.id} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-surface p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-ink">{opt.name.trim() || `Option ${optIndex + 1}`}</p>
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
                    placeholder="e.g. XL"
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

          <Button label="Add new option" variant="outline" onClick={addOption} className="min-h-0 py-3" />

          {generatedVariants.length > 0 ? (
            <div className="mt-1 flex flex-col gap-2">
              <p className="text-xs font-bold text-ink">Variant combinations</p>
              {generatedVariants.map((v) => {
                const saved = isExistingCombo(v)
                return (
                  <div key={v.id} className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-surface p-3">
                    <div className="flex items-start gap-2.5">
                      <VariantImageTile
                        imageUri={v.imageUri}
                        size={40}
                        onPick={(file) =>
                          updateVariant(v.id, {
                            imageFile: file,
                            imageUri: URL.createObjectURL(file),
                          })
                        }
                        onRemove={
                          v.imageUri
                            ? () =>
                                updateVariant(v.id, {
                                  imageUri: null,
                                  imageFile: undefined,
                                })
                            : undefined
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink">{v.name}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            saved ? 'bg-gray-100 text-ink' : 'bg-ink text-white'
                          }`}
                        >
                          {saved ? 'In store' : 'New'}
                        </span>
                      </div>
                    </div>
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
                )
              })}
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
