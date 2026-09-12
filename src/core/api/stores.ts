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
