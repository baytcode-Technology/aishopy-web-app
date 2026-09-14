import { authenticatedFetch } from '@/core/api/client'
import { endpoints } from '@/core/api/endpoints'

export type WhatsAppConnectResponse = {
  success: boolean
  message: string
  data: {
    url: string
    redirectUri: string | null
    oauthRedirectUri?: string | null
    signupUrlType?: string | null
    metaDialogUrlType?: string | null
  }
}

export type WhatsAppSyncJob = {
  id: string
  store_id: number
  sync_type: 'smb_app_state_sync' | 'history'
  request_id: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'declined'
  error_message: string | null
  started_at: string
  completed_at: string | null
}

export type WhatsAppConnectionStatus = {
  connected: boolean
  is_on_biz_app: boolean
  platform_type: string | null
  code_verification_status?: string | null
  phone_status?: string | null
  wa_phone_number_id: string | null
  wa_waba_id: string | null
  whatsapp_number: string | null
  sync_jobs: WhatsAppSyncJob[]
  sync_complete: boolean
}

export type WhatsAppConnectionStatusResponse = {
  success: boolean
  message: string
  data: WhatsAppConnectionStatus
}

export type WhatsAppTriggerSyncResponse = {
  success: boolean
  message: string
  data: unknown
}

function qs(storeId: number) {
  return new URLSearchParams({ store_id: String(storeId) }).toString()
}

export type WhatsAppCompleteOnboardingResponse = {
  success: boolean
  message: string
  data: {
    storeId: number
    phoneNumberId: string | null
    wabaId: string | null
    whatsappNumber: string | null
    syncTriggered: boolean
  }
}

export async function getWhatsAppConnectUrl(storeId: number): Promise<WhatsAppConnectResponse> {
  return authenticatedFetch<WhatsAppConnectResponse>(`${endpoints.whatsappConnect}?${qs(storeId)}`)
}

export async function completeWhatsAppOnboarding(
  storeId: number,
  input: { code: string; state?: string | null; wabaId?: string | null; phoneNumberId?: string | null },
): Promise<WhatsAppCompleteOnboardingResponse> {
  return authenticatedFetch<WhatsAppCompleteOnboardingResponse>(endpoints.whatsappCompleteOnboarding, {
    method: 'POST',
    body: JSON.stringify({
      storeId,
      code: input.code,
      state: input.state ?? undefined,
      wabaId: input.wabaId ?? undefined,
      phoneNumberId: input.phoneNumberId ?? undefined,
    }),
  })
}

export async function fetchWhatsAppConnectionStatus(
  storeId: number,
): Promise<WhatsAppConnectionStatusResponse> {
  return authenticatedFetch<WhatsAppConnectionStatusResponse>(
    `${endpoints.whatsappConnectionStatus}?${qs(storeId)}`,
  )
}

export type WhatsAppOffboardResponse = {
  success: boolean
  message: string
  data: {
    storeId: number
    wabaId: string | null
    phoneNumberId: string | null
    metaUnsubscribed: boolean
    metaUnsubscribeError: string | null
    localCredentialsCleared: boolean
    syncJobsCleared: boolean
    merchantSteps: string[]
  }
}

export async function offboardWhatsApp(storeId: number): Promise<WhatsAppOffboardResponse> {
  return authenticatedFetch<WhatsAppOffboardResponse>(endpoints.whatsappOffboard, {
    method: 'POST',
    body: JSON.stringify({ storeId }),
  })
}

export type WhatsAppClearChatHistoryResponse = {
  success: boolean
  message: string
  data: {
    storeId: number
    deletedConversations: number
  }
}

export async function clearWhatsAppChatHistory(
  storeId: number,
): Promise<WhatsAppClearChatHistoryResponse> {
  return authenticatedFetch<WhatsAppClearChatHistoryResponse>(endpoints.whatsappClearChatHistory, {
    method: 'POST',
    body: JSON.stringify({ storeId }),
  })
}

export async function triggerWhatsAppSync(storeId: number): Promise<WhatsAppTriggerSyncResponse> {
  return authenticatedFetch<WhatsAppTriggerSyncResponse>(endpoints.whatsappSync, {
    method: 'POST',
    body: JSON.stringify({ storeId }),
  })
}
