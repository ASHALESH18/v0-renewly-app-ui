/**
 * Locale-aware utilities for currency, date, and country formatting
 * Used throughout the app for locale-aware display without hardcoding assumptions
 */

export interface LocaleDefaults {
  countryCode: string
  countryName: string
  currencyCode: string
  locale: string
  timeZone: string
}

// Country to locale defaults mapping
const countryDefaults: Record<string, LocaleDefaults> = {
  IN: { countryCode: 'IN', countryName: 'India', currencyCode: 'INR', locale: 'en-IN', timeZone: 'Asia/Kolkata' },
  US: { countryCode: 'US', countryName: 'United States', currencyCode: 'USD', locale: 'en-US', timeZone: 'America/New_York' },
  GB: { countryCode: 'GB', countryName: 'United Kingdom', currencyCode: 'GBP', locale: 'en-GB', timeZone: 'Europe/London' },
  CA: { countryCode: 'CA', countryName: 'Canada', currencyCode: 'CAD', locale: 'en-CA', timeZone: 'America/Toronto' },
  AU: { countryCode: 'AU', countryName: 'Australia', currencyCode: 'AUD', locale: 'en-AU', timeZone: 'Australia/Sydney' },
  SG: { countryCode: 'SG', countryName: 'Singapore', currencyCode: 'SGD', locale: 'en-SG', timeZone: 'Asia/Singapore' },
  AE: { countryCode: 'AE', countryName: 'United Arab Emirates', currencyCode: 'AED', locale: 'en-AE', timeZone: 'Asia/Dubai' },
  EU: { countryCode: 'EU', countryName: 'Europe', currencyCode: 'EUR', locale: 'en-GB', timeZone: 'Europe/London' },
  JP: { countryCode: 'JP', countryName: 'Japan', currencyCode: 'JPY', locale: 'ja-JP', timeZone: 'Asia/Tokyo' },
}

export function getLocaleDefaultsForCountry(countryCode: string): LocaleDefaults {
  return countryDefaults[countryCode.toUpperCase()] || countryDefaults.US
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'INR',
  locale: string = 'en-IN'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback if currency or locale not supported
    return `${currencyCode} ${amount.toFixed(2)}`
  }
}

export function formatDate(
  date: Date | string,
  locale: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(dateObj)
  } catch {
    return new Date(date).toLocaleDateString()
  }
}

export function formatDateTime(
  date: Date | string,
  locale: string = 'en-IN',
  timeZone?: string
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timeZone || 'UTC',
    }).format(dateObj)
  } catch {
    return new Date(date).toLocaleString()
  }
}

export function formatDateShort(
  date: Date | string,
  locale: string = 'en-IN'
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj)
  } catch {
    return new Date(date).toLocaleDateString()
  }
}

export const currencies = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: '$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: '$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
]

export const countries = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'EU', name: 'Europe' },
  { code: 'JP', name: 'Japan' },
]

export function getCurrencySymbol(currencyCode: string): string {
  return currencies.find(c => c.code === currencyCode)?.symbol || currencyCode
}

export function getCurrencyName(currencyCode: string): string {
  return currencies.find(c => c.code === currencyCode)?.name || currencyCode
}

export function getCountryName(countryCode: string): string {
  return countries.find(c => c.code === countryCode)?.name || countryCode
}
