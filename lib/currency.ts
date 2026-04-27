import type { Subscription } from '@/lib/types'

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'JPY' | 'AED'

export type ExchangeRates = Record<string, number>

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AUD',
  'CAD',
  'SGD',
  'JPY',
  'AED',
]

export const FALLBACK_INR_RATES: ExchangeRates = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0095,
  AUD: 0.018,
  CAD: 0.0165,
  SGD: 0.0157,
  JPY: 1.82,
  AED: 0.044,
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  JPY: '¥',
  AED: 'د.إ',
}

const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AUD: 'en-AU',
  CAD: 'en-CA',
  SGD: 'en-SG',
  JPY: 'ja-JP',
  AED: 'en-AE',
}

export function normalizeCurrencyCode(value?: string | null): CurrencyCode {
  const normalized = String(value || '').trim().toUpperCase()

  if (normalized === '₹' || normalized === 'RS' || normalized === 'RS.' || normalized === 'RUPEE' || normalized === 'RUPEES') {
    return 'INR'
  }
  if (normalized === '$' || normalized === 'US$') return 'USD'
  if (normalized === '€') return 'EUR'
  if (normalized === '£') return 'GBP'
  if (normalized === 'A$') return 'AUD'
  if (normalized === 'C$') return 'CAD'
  if (normalized === 'S$') return 'SGD'
  if (normalized === '¥') return 'JPY'

  return SUPPORTED_CURRENCIES.includes(normalized as CurrencyCode)
    ? (normalized as CurrencyCode)
    : 'INR'
}

export function getCurrencySymbol(currency?: string | null): string {
  return CURRENCY_SYMBOLS[normalizeCurrencyCode(currency)] || normalizeCurrencyCode(currency)
}

export function getLocaleForCurrency(currency?: string | null, language = 'en'): string {
  const code = normalizeCurrencyCode(currency)

  if (language === 'hi') return 'hi-IN'
  if (language === 'fr' && code === 'EUR') return 'fr-FR'
  if (language === 'es' && code === 'EUR') return 'es-ES'

  return CURRENCY_LOCALES[code] || 'en-US'
}

export function currencyFractionDigits(currency?: string | null): number {
  const code = normalizeCurrencyCode(currency)
  return code === 'JPY' ? 0 : 2
}

export function formatCurrencyAmount(
  value: number,
  currency = 'INR',
  language = 'en',
  options: { compact?: boolean; maximumFractionDigits?: number } = {}
): string {
  const code = normalizeCurrencyCode(currency)
  const absValue = Math.abs(Number(value) || 0)
  const maximumFractionDigits =
    options.maximumFractionDigits ?? (absValue >= 100 || code === 'INR' ? 0 : currencyFractionDigits(code))
  const symbol = getCurrencySymbol(code)
  const numericValue = Number(value) || 0

  try {
    // Use Intl.NumberFormat only for number formatting (no currency symbol)
    const formatted = new Intl.NumberFormat(getLocaleForCurrency(code, language), {
      notation: options.compact ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits,
    }).format(numericValue)

    // Always prefix with our custom symbol to ensure consistent display
    return `${symbol}${formatted}`
  } catch {
    // Fallback: manual formatting if Intl fails
    const formatted = (numericValue).toLocaleString('en-US', {
      maximumFractionDigits,
    })
    return `${symbol}${formatted}`
  }
}

export function convertCurrency(
  amount: number,
  fromCurrency = 'INR',
  toCurrency = 'INR',
  rates: ExchangeRates = FALLBACK_INR_RATES
): number {
  const from = normalizeCurrencyCode(fromCurrency)
  const to = normalizeCurrencyCode(toCurrency)
  const numericAmount = Number(amount) || 0

  if (from === to) return numericAmount

  const sourceRate = Number(rates[from] ?? FALLBACK_INR_RATES[from] ?? 1)
  const targetRate = Number(rates[to] ?? FALLBACK_INR_RATES[to] ?? 1)

  if (!Number.isFinite(sourceRate) || !Number.isFinite(targetRate) || sourceRate <= 0 || targetRate <= 0) {
    return numericAmount
  }

  return numericAmount * (targetRate / sourceRate)
}

export function formatConvertedMoney(
  amount: number,
  fromCurrency: string | undefined,
  toCurrency: string,
  language = 'en',
  rates: ExchangeRates = FALLBACK_INR_RATES,
  options?: { compact?: boolean; maximumFractionDigits?: number }
): string {
  const converted = convertCurrency(amount, fromCurrency || toCurrency, toCurrency, rates)
  return formatCurrencyAmount(converted, toCurrency, language, options)
}

export function formatSubscriptionAmount(
  subscription: Pick<Subscription, 'amount' | 'currency'>,
  displayCurrency: string,
  language = 'en',
  rates: ExchangeRates = FALLBACK_INR_RATES,
  options?: { compact?: boolean; maximumFractionDigits?: number }
): string {
  return formatConvertedMoney(
    subscription.amount,
    subscription.currency || displayCurrency,
    displayCurrency,
    language,
    rates,
    options
  )
}

export function convertSubscriptionAmount(
  subscription: Pick<Subscription, 'amount' | 'currency'>,
  displayCurrency: string,
  rates: ExchangeRates = FALLBACK_INR_RATES
): number {
  return convertCurrency(
    subscription.amount,
    subscription.currency || displayCurrency,
    displayCurrency,
    rates
  )
}

export function getCurrencyFromCountry(countryCode?: string | null): CurrencyCode {
  switch (String(countryCode || '').toUpperCase()) {
    case 'IN':
      return 'INR'
    case 'GB':
      return 'GBP'
    case 'EU':
    case 'FR':
    case 'DE':
    case 'ES':
    case 'IT':
    case 'NL':
    case 'IE':
    case 'BE':
    case 'PT':
    case 'AT':
    case 'FI':
      return 'EUR'
    case 'CA':
      return 'CAD'
    case 'AU':
      return 'AUD'
    case 'SG':
      return 'SGD'
    case 'JP':
      return 'JPY'
    case 'AE':
      return 'AED'
    case 'US':
    default:
      return 'USD'
  }
}

export function getCurrencyFromLocale(locale?: string | null): CurrencyCode {
  const normalized = String(locale || '').toLowerCase()
  if (normalized.includes('-in') || normalized.startsWith('hi')) return 'INR'
  if (normalized.includes('-gb')) return 'GBP'
  if (normalized.includes('-ca')) return 'CAD'
  if (normalized.includes('-au')) return 'AUD'
  if (normalized.includes('-sg')) return 'SGD'
  if (normalized.includes('-jp') || normalized.startsWith('ja')) return 'JPY'
  if (normalized.includes('-ae')) return 'AED'
  if (normalized.startsWith('de') || normalized.startsWith('fr') || normalized.startsWith('es') || normalized.startsWith('it') || normalized.startsWith('nl')) return 'EUR'
  return 'USD'
}
