import type { CreateProductVariantPayload, ProductVariant } from '@/core/types/product'

export type VariantOption = {
  id: string
  name: string
  values: string[]
}

export type GeneratedVariant = {
  id: string
  name: string
  options: Record<string, string>
  priceDelta: string
  compareAtPrice: string
  stockQty: string
  sku: string
  imageUri?: string | null
  imageFile?: File
  isActive?: boolean
}

export function isPersistedVariantId(id: string): boolean {
  return /^\d+$/.test(id)
}

function normalizeOptions(options: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(options)
      .map(([k, v]) => [k, String(v ?? '').trim()])
      .filter(([, v]) => v),
  )
}

function optionsKey(options: Record<string, string>): string {
  return JSON.stringify(options)
}

export function extractVariantOptions(variants: ProductVariant[]): VariantOption[] {
  if (variants.length === 0) return []

  const firstKeys = Object.keys(variants[0].options ?? {})
  const allKeys = new Set<string>(firstKeys)
  for (const v of variants) {
    for (const k of Object.keys(v.options ?? {})) allKeys.add(k)
  }

  const orderedNames = [...firstKeys, ...[...allKeys].filter((k) => !firstKeys.includes(k))]

  return orderedNames.map((name, index) => {
    const values = new Set<string>()
    for (const v of variants) {
      const raw = v.options?.[name]
      if (raw != null && String(raw).trim()) values.add(String(raw).trim())
    }
    return {
      id: `opt-${name}-${index}`,
      name,
      values: [...values],
    }
  })
}

export function variantsToGenerated(variants: ProductVariant[]): GeneratedVariant[] {
  return variants.map((v) => ({
    id: String(v.id),
    name: v.name,
    options: normalizeOptions(v.options ?? {}),
    priceDelta: String(v.price_delta),
    compareAtPrice: v.compare_at_price != null ? String(v.compare_at_price) : '',
    stockQty: String(v.stock_qty),
    sku: v.sku ?? '',
    imageUri: v.image_url ?? null,
    isActive: v.is_active,
  }))
}

export function hydrateVariantEditorState(variants: ProductVariant[]): {
  options: VariantOption[]
  generated: GeneratedVariant[]
} {
  if (variants.length === 0) {
    return { options: [], generated: [] }
  }
  const options = extractVariantOptions(variants)
  const generated = generateVariantsFromOptions(options, variantsToGenerated(variants))
  return { options, generated }
}

export type VariantDiff = {
  toCreate: GeneratedVariant[]
  toUpdate: GeneratedVariant[]
  toDelete: ProductVariant[]
}

export function diffVariants(
  generated: GeneratedVariant[],
  existingVariants: ProductVariant[],
): VariantDiff {
  const existingByKey = new Map<string, ProductVariant>()
  for (const v of existingVariants) {
    existingByKey.set(optionsKey(normalizeOptions(v.options ?? {})), v)
  }

  const generatedKeys = new Set<string>()
  const toCreate: GeneratedVariant[] = []
  const toUpdate: GeneratedVariant[] = []

  for (const g of generated) {
    const key = optionsKey(g.options)
    generatedKeys.add(key)
    const existing = existingByKey.get(key)
    if (existing) {
      toUpdate.push({ ...g, id: String(existing.id) })
    } else {
      toCreate.push(g)
    }
  }

  const toDelete = existingVariants.filter((v) => {
    const key = optionsKey(normalizeOptions(v.options ?? {}))
    return !generatedKeys.has(key)
  })

  return { toCreate, toUpdate, toDelete }
}

function cartesian(options: VariantOption[]): Record<string, string>[] {
  const active = options.filter((o) => o.name.trim() && o.values.some((v) => v.trim()))
  if (active.length === 0) return []

  return active.reduce<Record<string, string>[]>(
    (acc, option) => {
      const values = option.values.map((v) => v.trim()).filter(Boolean)
      if (values.length === 0) return acc
      const next: Record<string, string>[] = []
      for (const combo of acc.length ? acc : [{}]) {
        for (const value of values) {
          next.push({ ...combo, [option.name.trim()]: value })
        }
      }
      return next
    },
    [],
  )
}

export function generateVariantsFromOptions(
  options: VariantOption[],
  previous: GeneratedVariant[] = [],
): GeneratedVariant[] {
  const combos = cartesian(options)
  if (combos.length === 0) return []

  return combos.map((opts, index) => {
    const name = Object.values(opts).join(' / ')
    const key = JSON.stringify(opts)
    const existing = previous.find((p) => JSON.stringify(p.options) === key)
    return {
      id: existing?.id ?? `gen-${index}-${Date.now()}`,
      name,
      options: opts,
      priceDelta: existing?.priceDelta ?? '0',
      compareAtPrice: existing?.compareAtPrice ?? '',
      stockQty: existing?.stockQty ?? '0',
      sku: existing?.sku ?? '',
      imageUri: existing?.imageUri ?? null,
      imageFile: existing?.imageFile,
      isActive: existing?.isActive,
    }
  })
}

export function toCreateVariantPayload(
  v: GeneratedVariant,
  imageUrl?: string | null,
): CreateProductVariantPayload {
  const compareTrimmed = v.compareAtPrice.trim()
  const compare_at_price = compareTrimmed ? Number(compareTrimmed) || null : null
  return {
    name: v.name,
    options: v.options,
    price_delta: Number(v.priceDelta) || 0,
    compare_at_price,
    stock_qty: Number(v.stockQty) || 0,
    sku: v.sku.trim() || undefined,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    is_active: true,
    sort_order: 0,
  }
}

export async function uploadVariantImagesForCreate(
  storeId: number,
  variants: GeneratedVariant[],
  upload: (storeId: number, files: File[]) => Promise<string[]>,
): Promise<Map<string, string>> {
  const withImage = variants.filter((v) => v.imageFile)
  if (withImage.length === 0) return new Map()
  const urls = await upload(
    storeId,
    withImage.map((v) => v.imageFile!),
  )
  const map = new Map<string, string>()
  withImage.forEach((v, i) => {
    const url = urls[i]
    if (url) map.set(v.id, url)
  })
  return map
}
