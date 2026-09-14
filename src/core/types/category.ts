export type Category = {
  id: number
  store_id: number
  parent_id: number | null
  name: string
  image_url: string | null
  sort_order: number
  is_active: boolean
  description?: string | null
  created_at: string
  product_count?: number
}

export type UpdateCategoryPayload = Partial<{
  name: string
  image_url: string | null
  is_active: boolean
  description: string | null
  parent_id: number | null
}>

export type ListCategoriesResponse = {
  success: boolean
  message: string
  data: {
    store_id: number
    categories: Category[]
    count: number
  }
}

export type CreateCategoryPayload = {
  store_id: number
  name: string
  image_url?: string | null
  parent_id?: number
  sort_order?: number
  is_active?: boolean
}

export type CreateCategoryResponse = {
  success: boolean
  message: string
  data: Category
}
