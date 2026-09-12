import {
  createProductVariant,
  deleteProductVariant,
  updateProductVariant,
} from '@/core/api/products'
import { parseOptionalPrice } from '@/core/lib/parse-optional-price'
import {
  diffVariants,
  toCreateVariantPayload,
  uploadVariantImagesForCreate,
  type GeneratedVariant,
} from '@/core/lib/variant-options'
import type { ProductVariant } from '@/core/types/product'

export async function persistVariantChanges(input: {
  productId: number
  storeId: number
  generated: GeneratedVariant[]
  initialVariants: ProductVariant[]
  uploadImages: (storeId: number, files: File[]) => Promise<string[]>
}): Promise<{ created: number; updated: number; deleted: number }> {
  const { productId, storeId, generated, initialVariants, uploadImages } = input
  const { toCreate, toUpdate, toDelete } = diffVariants(generated, initialVariants)

  for (const v of toDelete) {
    await deleteProductVariant(productId, v.id)
  }

  const needsUpload = [...toUpdate, ...toCreate].filter((v) => v.imageFile)
  const uploadedImageUrls = await uploadVariantImagesForCreate(storeId, needsUpload, uploadImages)

  let updated = 0
  for (const v of toUpdate) {
    const original = initialVariants.find((o) => String(o.id) === v.id)
    if (!original) continue

    const compareNum = parseOptionalPrice(v.compareAtPrice)
    if (compareNum === undefined) {
      throw new Error(`Invalid compare at price for ${v.name}`)
    }

    let image_url: string | null | undefined
    if (v.imageUri === null) {
      image_url = null
    } else if (v.imageFile) {
      image_url = uploadedImageUrls.get(v.id) ?? null
    } else if (v.imageUri?.startsWith('http')) {
      image_url = v.imageUri
    }

    const payload = {
      name: v.name.trim(),
      price_delta: Number(v.priceDelta) || 0,
      compare_at_price: compareNum,
      stock_qty: Number(v.stockQty) || 0,
      sku: v.sku.trim() || null,
      is_active: v.isActive ?? true,
      options: v.options,
      ...(image_url !== undefined ? { image_url } : {}),
    }

    const changed =
      original.name !== payload.name ||
      Number(original.price_delta) !== payload.price_delta ||
      (original.compare_at_price ?? null) !== payload.compare_at_price ||
      original.stock_qty !== payload.stock_qty ||
      (original.sku ?? '') !== (payload.sku ?? '') ||
      original.is_active !== payload.is_active ||
      JSON.stringify(normalizeOpts(original.options)) !== JSON.stringify(v.options) ||
      image_url !== undefined

    if (changed) {
      await updateProductVariant(productId, Number(v.id), payload)
      updated++
    }
  }

  let created = 0
  const baseSort = initialVariants.length
  for (let i = 0; i < toCreate.length; i++) {
    const v = toCreate[i]
    await createProductVariant(productId, {
      ...toCreateVariantPayload(v, uploadedImageUrls.get(v.id)),
      sort_order: baseSort + i,
    })
    created++
  }

  return { created, updated, deleted: toDelete.length }
}

function normalizeOpts(options: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(options ?? {}).map(([k, val]) => [k, String(val ?? '').trim()]),
  )
}
