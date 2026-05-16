/**
 * Client-side hook for detecting user's country and currency for pricing
 * Falls back to browser locale when server-side detection is unavailable
 */

'use client'

import { useEffect, useState } from 'react'
import { getCurrencyFromLocale, getCurrencyFromCountry, type CurrencyCode } from '@/lib/currency'

export function usePricingCurrency(): CurrencyCode {
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Try to detect currency from browser locale
    const detectedCurrency = getCurrencyFromLocale(navigator.language)
    setCurrency(detectedCurrency)
    setIsLoaded(true)
  }, [])

  return currency
}

/**
 * Get country code from IP geolocation service
 * Fallback method when server-side headers aren't available
 */
export async function detectCountryFromGeoIP(): Promise<string | null> {
  try {
    // Using Vercel's own geolocation API via request headers
    // This is already available via cf-ipcountry in server context
    // On client, we would use: https://geolocation-api.vercel.app
    const response = await fetch('https://geolocation-api.vercel.app', {
      headers: { 'accept': 'application/json' },
    })
    const data = await response.json()
    return data.country_code || null
  } catch {
    return null
  }
}
