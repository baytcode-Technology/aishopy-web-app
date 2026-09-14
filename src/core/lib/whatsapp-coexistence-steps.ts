/** Merchant-facing steps for WhatsApp Business coexistence connect / sync. */

export const WHATSAPP_PREP_STEPS: string[] = [
  'Install WhatsApp Business on the phone that owns the business number (v2.24.17 or newer).',
  'Open WhatsApp Business and stay logged in with that business number.',
  'Keep the phone online. During connect, Meta may ask you to scan a QR or enter a verification code — complete that in WhatsApp Business when it appears.',
  'If you connected this number to AiShopy before: WhatsApp Business → Settings → Account → Business platform → disconnect AiShopy / BaytCode / partner, then return here.',
  'Tap Connect WhatsApp below and finish every Meta screen without skipping verification.',
]

export const WHATSAPP_FIX_STEPS: string[] = [
  'On the phone, open WhatsApp Business.',
  'Go to Settings → Account → Business platform (some phones say Business tools or partner apps).',
  'If AiShopy / BaytCode / a Meta partner is listed, Disconnect, wait a few seconds, then return here and tap Reconnect account if needed.',
  'Complete any QR, code, or “continue in WhatsApp” prompt Meta shows — do not skip it.',
  'Return to this screen and tap Retry sync (best within 24 hours of linking).',
  'If Retry still fails: disconnect in Business platform again, use Disconnect & reconnect from scratch here, then Connect again and finish verification when asked.',
]

export function syncStuckReason(status: {
  code_verification_status?: string | null
}): string {
  const verification = status.code_verification_status?.toUpperCase() ?? ''
  if (verification && verification !== 'VERIFIED') {
    return 'Phone verification with Meta is incomplete (common after reconnect if no QR or code was shown). Finish the steps below, then tap Retry sync.'
  }
  return 'Meta has not finished phone / partner verification for contact sync (common after reconnect without QR or code). Finish the steps below, then tap Retry sync.'
}
