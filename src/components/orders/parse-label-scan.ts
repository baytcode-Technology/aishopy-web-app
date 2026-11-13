export type LabelScan = {
  trackingNumber: string
  courierName: string
}

const TRACKING_KEYS = new Set(['awbno', 'awb', 'tracking', 'trackingno', 'trackingnumber', 'waybill'])
const COURIER_KEYS = new Set(['shipc', 'courier', 'carrier'])

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_-]/g, '')
}

export function parseLabelScan(raw: string): LabelScan {
  const text = raw.trim()
  if (!text) return { trackingNumber: '', courierName: '' }

  let trackingNumber = ''
  let courierName = ''
  let sawKey = false

  for (const part of text.split(/[;,]/)) {
    const piece = part.trim()
    const colon = piece.indexOf(':')
    if (colon <= 0) continue
    const key = normalizeKey(piece.slice(0, colon))
    const value = piece.slice(colon + 1).trim()
    if (!key || !value) continue
    sawKey = true
    if (!trackingNumber && TRACKING_KEYS.has(key)) trackingNumber = value
    if (!courierName && COURIER_KEYS.has(key)) courierName = value
  }

  if (!sawKey) return { trackingNumber: text, courierName: '' }
  return { trackingNumber, courierName }
}
