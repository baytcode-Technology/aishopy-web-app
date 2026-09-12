import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

type AdminStatusResponse = {
  success: boolean
  data: { isAdmin: boolean }
}

export function fetchSupportAdminStatus() {
  return authenticatedFetch<AdminStatusResponse>(endpoints.supportAdminMe)
}
