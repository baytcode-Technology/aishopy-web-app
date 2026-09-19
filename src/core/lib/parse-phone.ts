import { COUNTRY_DIAL_CODES } from '@/core/data/country-dial-codes'

export function formatE164(callingCode: string, national: string): string {
  const digits = national.replace(/\D/g, '')
  if (!digits) return ''
  return `+${callingCode}${digits}`
}

export function parseE164Phone(
  value: string,
  fallbackCode = 'IN',
): { countryCode: string; callingCode: string; national: string } {
  const fallbackCalling = COUNTRY_DIAL_CODES[fallbackCode] ?? '1'
  const cleaned = value.trim()
  if (!cleaned) {
    return { countryCode: fallbackCode, callingCode: fallbackCalling, national: '' }
  }

  if (!cleaned.startsWith('+')) {
    return {
      countryCode: fallbackCode,
      callingCode: fallbackCalling,
      national: cleaned.replace(/\D/g, ''),
    }
  }

  const digits = cleaned.slice(1).replace(/\D/g, '')
  const prefixes = Object.entries(COUNTRY_DIAL_CODES)
    .map(([countryCode, code]) => ({ countryCode, code }))
    .sort((a, b) => b.code.length - a.code.length)

  for (const prefix of prefixes) {
    if (digits.startsWith(prefix.code)) {
      return {
        countryCode: prefix.countryCode,
        callingCode: prefix.code,
        national: digits.slice(prefix.code.length),
      }
    }
  }

  return {
    countryCode: fallbackCode,
    callingCode: fallbackCalling,
    national: digits,
  }
}
