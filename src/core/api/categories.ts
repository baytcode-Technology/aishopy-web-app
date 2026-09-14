import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import type {
  Category,
  CreateCategoryPayload,
  CreateCategoryResponse,
  ListCategoriesResponse,
  UpdateCategoryPayload,
} from '@/core/types/category'

export async function fetchCategories(storeId: number): Promise<ListCategoriesResponse> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch<ListCategoriesResponse>(`${endpoints.categories}?${qs.toString()}`)
}

export async function createCategory(
  payload: CreateCategoryPayload,
): Promise<CreateCategoryResponse> {
  return authenticatedFetch<CreateCategoryResponse>(endpoints.categories, {
    method: 'POST',
    body: JSON.stringify({
      sort_order: 0,
      is_active: true,
      ...payload,
    }),
  })
}

export type SyncCategoryProductsResponse = {
  success: boolean
  message: string
  data: { assigned: number; removed: number }
}

export type UpdateCategoryResponse = {
  success: boolean
  message: string
  data: Category
}

export async function updateCategory(
  categoryId: number,
  payload: UpdateCategoryPayload,
): Promise<UpdateCategoryResponse> {
  return authenticatedFetch<UpdateCategoryResponse>(`${endpoints.categories}/${categoryId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteCategory(
  categoryId: number,
): Promise<{ success: boolean; message: string }> {
  return authenticatedFetch(`${endpoints.categories}/${categoryId}`, {
    method: 'DELETE',
  })
}

export async function syncCategoryProducts(
  storeId: number,
  categoryId: number,
  productIds: number[],
): Promise<SyncCategoryProductsResponse> {
  return authenticatedFetch<SyncCategoryProductsResponse>(
    `${endpoints.categories}/${categoryId}/products`,
    {
      method: 'PUT',
      body: JSON.stringify({ store_id: storeId, product_ids: productIds }),
    },
  )
}
