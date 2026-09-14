export const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AE: 'AED',
  SA: 'SAR',
  CA: 'CAD',
  AU: 'AUD',
  SG: 'SGD',
  MY: 'MYR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  JP: 'JPY',
  CN: 'CNY',
  HK: 'HKD',
  NZ: 'NZD',
  ZA: 'ZAR',
  BR: 'BRL',
  MX: 'MXN',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  QA: 'QAR',
  KW: 'KWD',
  OM: 'OMR',
  BH: 'BHD',
  ID: 'IDR',
  TH: 'THB',
  PH: 'PHP',
  VN: 'VND',
  KR: 'KRW',
  TR: 'TRY',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  RU: 'RUB',
}

export function defaultCurrencyForCountry(countryCode: string): string {
  return DEFAULT_CURRENCY_BY_COUNTRY[countryCode.toUpperCase()] ?? 'USD'
}

export type CountryValue = {
  name: string
  cca2: string
}

export const COUNTRY_OPTIONS: CountryValue[] = [
  { name: 'India', cca2: 'IN' },
  { name: 'United States', cca2: 'US' },
  { name: 'United Kingdom', cca2: 'GB' },
  { name: 'United Arab Emirates', cca2: 'AE' },
  { name: 'Saudi Arabia', cca2: 'SA' },
  { name: 'Canada', cca2: 'CA' },
  { name: 'Australia', cca2: 'AU' },
  { name: 'Singapore', cca2: 'SG' },
  { name: 'Malaysia', cca2: 'MY' },
  { name: 'Germany', cca2: 'DE' },
  { name: 'France', cca2: 'FR' },
  { name: 'Italy', cca2: 'IT' },
  { name: 'Spain', cca2: 'ES' },
  { name: 'Netherlands', cca2: 'NL' },
  { name: 'Japan', cca2: 'JP' },
  { name: 'China', cca2: 'CN' },
  { name: 'Hong Kong', cca2: 'HK' },
  { name: 'New Zealand', cca2: 'NZ' },
  { name: 'South Africa', cca2: 'ZA' },
  { name: 'Brazil', cca2: 'BR' },
  { name: 'Mexico', cca2: 'MX' },
  { name: 'Pakistan', cca2: 'PK' },
  { name: 'Bangladesh', cca2: 'BD' },
  { name: 'Sri Lanka', cca2: 'LK' },
  { name: 'Nepal', cca2: 'NP' },
  { name: 'Qatar', cca2: 'QA' },
  { name: 'Kuwait', cca2: 'KW' },
  { name: 'Oman', cca2: 'OM' },
  { name: 'Bahrain', cca2: 'BH' },
  { name: 'Indonesia', cca2: 'ID' },
  { name: 'Thailand', cca2: 'TH' },
  { name: 'Philippines', cca2: 'PH' },
  { name: 'Vietnam', cca2: 'VN' },
  { name: 'South Korea', cca2: 'KR' },
  { name: 'Turkey', cca2: 'TR' },
  { name: 'Switzerland', cca2: 'CH' },
  { name: 'Sweden', cca2: 'SE' },
  { name: 'Norway', cca2: 'NO' },
  { name: 'Denmark', cca2: 'DK' },
  { name: 'Poland', cca2: 'PL' },
  { name: 'Russia', cca2: 'RU' },
]

export const DEFAULT_COUNTRY: CountryValue = {
  name: 'United States',
  cca2: 'US',
}

/** Match stored country name to a picker code when possible. */
export function guessCountryCodeFromName(countryName: string): string {
  const normalized = countryName.trim().toLowerCase()
  const map: Record<string, string> = {
    india: 'IN',
    'united states': 'US',
    'united kingdom': 'GB',
    'united arab emirates': 'AE',
    uae: 'AE',
    canada: 'CA',
    australia: 'AU',
    singapore: 'SG',
    malaysia: 'MY',
    germany: 'DE',
    france: 'FR',
    japan: 'JP',
    china: 'CN',
    pakistan: 'PK',
    bangladesh: 'BD',
    'sri lanka': 'LK',
    nepal: 'NP',
    'saudi arabia': 'SA',
  }
  if (map[normalized]) return map[normalized]
  const found = COUNTRY_OPTIONS.find((item) => item.name.toLowerCase() === normalized)
  return found?.cca2 ?? 'US'
}
