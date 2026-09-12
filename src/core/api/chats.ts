import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

type ChatListResponse = {
  data: {
    chats: unknown[]
  }
}

export async function fetchChats(storeId: number): Promise<ChatListResponse> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch<ChatListResponse>(`${endpoints.whatsappChats}?${qs.toString()}`)
}

export async function fetchInstagramChats(storeId: number): Promise<ChatListResponse> {
  const qs = new URLSearchParams({ store_id: String(storeId) })
  return authenticatedFetch<ChatListResponse>(`${endpoints.instagramChats}?${qs.toString()}`)
}

export async function fetchAllChats(storeId: number): Promise<{
  whatsapp: unknown[]
  instagram: unknown[]
}> {
  const [waResult, igResult] = await Promise.allSettled([
    fetchChats(storeId).then((res) => res.data.chats),
    fetchInstagramChats(storeId).then((res) => res.data.chats),
  ])

  return {
    whatsapp: waResult.status === 'fulfilled' ? waResult.value : [],
    instagram: igResult.status === 'fulfilled' ? igResult.value : [],
  }
}
