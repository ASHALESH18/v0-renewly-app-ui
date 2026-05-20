'use client'

import { useEffect, useState } from 'react'
import type { RenewlyCurrency } from '@/lib/renewly-pricing'

/**
 * Combo 2B: Client-safe currency preference hook
 * Reads from URL query (?currency=USD|INR), localStorage, or cookie fallback
 * Handles hydration safely without window crashes
 */
export function useCurrencyPreference(): RenewlyCurrency {
  const [currency, setCurrency] = useState<RenewlyCurrency>('INR')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    try {
      // Try URL query first (highest priority)
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const queryParam = params.get('currency')
      
      if (queryParam === 'USD' || queryParam === 'INR') {
        // Save to localStorage and cookie
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('renewly_currency_override', queryParam)
        }
        // Also set cookie
        if (typeof document !== 'undefined') {
          document.cookie = `renewly_currency_override=${queryParam}; path=/; max-age=2592000`
        }
        setCurrency(queryParam)
        return
      }

      // Try localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('renewly_currency_override')
        if (stored === 'USD' || stored === 'INR') {
          setCurrency(stored)
          return
        }
      }

      // Try cookie as fallback
      if (typeof document !== 'undefined') {
        const cookieValue = document.cookie
          .split('; ')
          .find(row => row.startsWith('renewly_currency_override='))
          ?.split('=')[1]
        if (cookieValue === 'USD' || cookieValue === 'INR') {
          setCurrency(cookieValue)
          return
        }
      }

      // Default to INR
      setCurrency('INR')
    } catch (error) {
      // Silently fail, default to INR
      console.warn('[v0] Error reading currency preference:', error)
      setCurrency('INR')
    }
  }, [])

  return currency
}

/**
 * Set currency preference (localStorage + cookie)
 * Returns true if successful, false otherwise
 */
export function setCurrencyPreference(currency: RenewlyCurrency): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    if (window.localStorage) {
      window.localStorage.setItem('renewly_currency_override', currency)
    }
    if (typeof document !== 'undefined') {
      document.cookie = `renewly_currency_override=${currency}; path=/; max-age=2592000`
    }
    return true
  } catch (error) {
    console.warn('[v0] Error setting currency preference:', error)
    return false
  }
}

/**
 * Get currency from URL query parameter (immediate, no state)
 * Returns the param if valid, otherwise null
 */
export function getCurrencyFromUrl(): RenewlyCurrency | null {
  if (typeof window === 'undefined') return null
  
  try {
    const params = new URLSearchParams(window.location.search)
    const param = params.get('currency')
    return param === 'USD' || param === 'INR' ? param : null
  } catch (error) {
    return null
  }
}
