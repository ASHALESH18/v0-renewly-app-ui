/**
 * Country detection utilities - detect user's country from request headers
 * and Cloudflare geo data for pricing display
 */

import { headers } from 'next/headers'
import { getCurrencyFromCountry } from './currency'
import type { CurrencyCode } from './currency'

/**
 * Detect country from request headers (Cloudflare, Vercel, or other sources)
 * Returns ISO 2-letter country code (e.g., 'IN', 'US', 'GB')
 */
export function detectCountryFromHeaders(): string | null {
  const headersList = headers()

  // Cloudflare - most reliable source
  const cfCountry = headersList.get('cf-ipcountry')
  if (cfCountry) return cfCountry.toUpperCase()

  // Vercel (x-vercel-ip-country)
  const vercelCountry = headersList.get('x-vercel-ip-country')
  if (vercelCountry) return vercelCountry.toUpperCase()

  // Fallback to Accept-Language header (less reliable)
  const acceptLanguage = headersList.get('accept-language')
  if (acceptLanguage) {
    const match = acceptLanguage.match(/en-([A-Z]{2})/i)
    if (match) return match[1].toUpperCase()
  }

  return null
}

/**
 * Get effective currency for pricing based on country detection
 * Prioritizes: stored user preference → detected country → default USD
 */
export function getCurrencyByCountry(
  userCurrency?: string | null,
  countryCode?: string | null
): CurrencyCode {
  // User has stored currency preference, use it
  if (userCurrency && (userCurrency === 'INR' || userCurrency === 'USD' || userCurrency === 'EUR')) {
    return userCurrency as CurrencyCode
  }

  // Try to detect from country code
  if (countryCode) {
    return getCurrencyFromCountry(countryCode)
  }

  // Default to USD
  return 'USD'
}

/**
 * Server-side function to get country for pricing context
 * Use this in Server Components to pass country to client components
 */
export async function getCountryForPricing(): Promise<string | null> {
  return detectCountryFromHeaders()
}
