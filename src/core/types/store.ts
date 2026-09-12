export type StoreAccessRole = 'owner' | 'staff'

export type StoreListItem = {
  store: Store
  role: StoreAccessRole
}

export type StoreStaffStatus = 'pending' | 'active'

export type StoreStaffMember = {
  id: number | null
  email: string
  user_id: string | null
  role: 'owner' | 'staff'
  status: StoreStaffStatus | 'owner'
}

export type ThemeTemplate = 'classic' | 'boutique' | 'modern'

export type ThemeProductCard = 'classic' | 'minimal' | 'bold'

export type ThemeConfig = {
  template: ThemeTemplate
  colors: {
    primary: string
    background: string
    text: string
  }
  productCard?: ThemeProductCard
}

export type Store = {
  id: number
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp_number: string | null
  wa_phone_number_id: string | null
  wa_waba_id: string | null
  wa_access_token: string | null
  currency: string
  country: string
  timezone: string
  payment_config: Record<string, unknown>
  theme_config?: ThemeConfig | null
  ai_system_prompt: string | null
  ai_language: string | null
  ai_auto_reply_enabled?: boolean
  industry: string | null
  is_active: boolean
  subscription_plan?: 'starter' | 'business' | 'enterprise'
  subscription_expires_at?: string | null
  product_count?: number
  order_count?: number
  created_at: string
  updated_at: string
}

export type MyStoreResponse = {
  success: boolean
  message: string
  data: {
    hasStore: boolean
    store: Store | null
    role: StoreAccessRole | null
  }
}

export type MyStoresResponse = {
  success: boolean
  message: string
  data: {
    stores: StoreListItem[]
    count: number
  }
}

export type StoreStaffResponse = {
  success: boolean
  message: string
  data: {
    members: StoreStaffMember[]
  }
}

export type CreateStorePayload = {
  name: string
  slug: string
  whatsapp_number: string | null
  currency: string
  country: string
  description?: string | null
  industry?: string | null
  logo_url?: string | null
}

export type UpdateStorePayload = Partial<{
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  banner_url: string | null
  whatsapp_number: string | null
  currency: string
  country: string
  timezone: string
  industry: string | null
  ai_system_prompt: string | null
  ai_language: string | null
  is_active: boolean
  theme_config: ThemeConfig | null
}>

export type UpdateStoreResponse = {
  success: boolean
  message: string
  data: { store: Store }
}

export type CreateStoreResponse = {
  success: boolean
  message: string
  data: {
    store: Store
    subdomainUrl: string
  }
}

export type StoreSession = {
  storeId: number
  slug: string
  name: string
  subdomainUrl: string
  role: StoreAccessRole
}
