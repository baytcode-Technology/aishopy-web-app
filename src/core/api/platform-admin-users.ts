import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import type {
  AdminUsersListQuery,
  ListPlatformAdminUsersResult,
  PlatformAdminUserDetail,
} from '@/core/types/platform-admin-users'

type ListResponse = {
  success: boolean
  data: ListPlatformAdminUsersResult
}

type DetailResponse = {
  success: boolean
  data: PlatformAdminUserDetail
}

function toQuery(params: AdminUsersListQuery): string {
  const search = new URLSearchParams()
  if (params.q?.trim()) search.set('q', params.q.trim())
  if (params.hasStore) search.set('hasStore', params.hasStore)
  if (params.plan) search.set('plan', params.plan)
  if (params.signedAfter) search.set('signedAfter', params.signedAfter)
  if (params.page) search.set('page', String(params.page))
  if (params.limit) search.set('limit', String(params.limit))
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function fetchPlatformAdminUsers(query: AdminUsersListQuery = {}) {
  return authenticatedFetch<ListResponse>(`${endpoints.platformAdminUsers}${toQuery(query)}`)
}

export function fetchPlatformAdminUser(userId: string) {
  return authenticatedFetch<DetailResponse>(endpoints.platformAdminUser(userId))
}
