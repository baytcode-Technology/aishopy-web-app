import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import type {
  CreateStorePayload,
  CreateStoreResponse,
  MyStoreResponse,
  MyStoresResponse,
  StoreStaffResponse,
  UpdateStorePayload,
  UpdateStoreResponse,
} from '@/core/types/store'

export function storeIdQuery(storeId: number) {
  return `?store_id=${storeId}`
}

export async function fetchMyStores(): Promise<MyStoresResponse> {
  return authenticatedFetch<MyStoresResponse>(endpoints.storesMine)
}

export async function fetchMyStore(storeId?: number): Promise<MyStoreResponse> {
  const query = storeId != null ? storeIdQuery(storeId) : ''
  return authenticatedFetch<MyStoreResponse>(`${endpoints.storesMe}${query}`)
}

export async function createStore(payload: CreateStorePayload): Promise<CreateStoreResponse> {
  return authenticatedFetch<CreateStoreResponse>(endpoints.stores, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateMyStore(
  storeId: number,
  payload: UpdateStorePayload,
): Promise<UpdateStoreResponse> {
  return authenticatedFetch<UpdateStoreResponse>(
    `${endpoints.storesMe}${storeIdQuery(storeId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
}

export async function fetchStoreStaff(storeId: number): Promise<StoreStaffResponse> {
  return authenticatedFetch<StoreStaffResponse>(
    `${endpoints.storesStaff}${storeIdQuery(storeId)}`,
  )
}

export async function inviteStoreStaff(storeId: number, email: string) {
  return authenticatedFetch<{
    success: boolean
    message: string
    data: { staff: { id: number; email: string; status: string } }
  }>(`${endpoints.storesStaff}${storeIdQuery(storeId)}`, {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function removeStoreStaff(storeId: number, staffId: number) {
  return authenticatedFetch<{ success: boolean; message: string }>(
    `${endpoints.storesStaff}/${staffId}${storeIdQuery(storeId)}`,
    { method: 'DELETE' },
  )
}

export type CustomDomainStatus = 'none' | 'pending' | 'active' | 'failed'

export type CustomDomainView = {
  subdomain: string
  custom_domain: string | null
  status: CustomDomainStatus
  verified_at: string | null
  cname_host: string
  cname_target: string
}

type CustomDomainResponse = {
  success: boolean
  message?: string
  data: CustomDomainView
}

export async function fetchCustomDomain(storeId: number): Promise<CustomDomainView> {
  const res = await authenticatedFetch<CustomDomainResponse>(
    `${endpoints.customDomain}${storeIdQuery(storeId)}`,
  )
  return res.data
}

export async function saveCustomDomain(storeId: number, domain: string): Promise<CustomDomainView> {
  const res = await authenticatedFetch<CustomDomainResponse>(
    `${endpoints.customDomain}${storeIdQuery(storeId)}`,
    {
      method: 'PUT',
      body: JSON.stringify({ domain }),
    },
  )
  return res.data
}

export async function verifyCustomDomain(storeId: number): Promise<CustomDomainView> {
  const res = await authenticatedFetch<CustomDomainResponse>(
    `${endpoints.customDomain}/verify${storeIdQuery(storeId)}`,
    { method: 'POST' },
  )
  return res.data
}

export async function deleteCustomDomain(storeId: number): Promise<CustomDomainView> {
  const res = await authenticatedFetch<CustomDomainResponse>(
    `${endpoints.customDomain}${storeIdQuery(storeId)}`,
    { method: 'DELETE' },
  )
  return res.data
}
