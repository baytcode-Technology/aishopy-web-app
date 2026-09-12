import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

type AdminStatusResponse = {
  success: boolean
  data: { isAdmin: boolean }
}

export function fetchSupportAdminStatus() {
  return authenticatedFetch<AdminStatusResponse>(endpoints.supportAdminMe)
}

export type SupportAdminSummary = {
  escalated_count: number
  unread_messages: number
  awaiting_manual_count: number
}

export function fetchSupportAdminSummary() {
  return authenticatedFetch<{
    success: boolean
    data: SupportAdminSummary
  }>(endpoints.supportAdminSummary)
}
