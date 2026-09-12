import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'
import type { ListIndustriesResponse } from '@/core/types/industry'

export async function fetchIndustries(): Promise<ListIndustriesResponse> {
  return authenticatedFetch<ListIndustriesResponse>(endpoints.industries)
}
