/**
 * Pricing display utilities - Single source of truth for pricing across paywall and pricing pages
 * Supports multi-currency display: INR, USD, EUR
 */

import { getPlan } from './plans'

export interface PricingDisplay {
  amount: number
  currency: string
  symbol: string
  period: string
  displayText: string // e.g., "From ₹149/month"
}

/**
 * Get pricing for Pro plan with currency localization
 * Priority: explicit currency → user settings → locale → default (INR)
 */
export function getPricingForPaywall(
  currencyCode: string = 'INR'
): PricingDisplay {
  const proPlan = getPlan('pro')
  if (!proPlan || proPlan.price === null) {
    return {
      amount: 149,
      currency: 'INR',
      symbol: '₹',
      period: 'month',
      displayText: 'From ₹149/month',
    }
  }

  // Map prices by currency (using INR as source, you'd scale these based on real conversion)
  const priceMap: Record<string, { amount: number; symbol: string }> = {
    INR: { amount: 149, symbol: '₹' },
    USD: { amount: 2, symbol: '$' },
    EUR: { amount: 1.99, symbol: '€' },
  }

  const pricing = priceMap[currencyCode] || priceMap.INR

  return {
    amount: pricing.amount,
    currency: currencyCode,
    symbol: pricing.symbol,
    period: 'month',
    displayText: `From ${pricing.symbol}${pricing.amount}/${proPlan.period}`,
  }
}

/**
 * Format currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const map: Record<string, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  return map[currencyCode] || currencyCode
}

/**
 * Get user's likely currency based on locale/settings
 * Falls back to INR if unknown
 */
export function getUserCurrency(
  userCurrency?: string,
  locale?: string
): string {
  // If explicitly set, use it
  if (userCurrency && ['INR', 'USD', 'EUR'].includes(userCurrency)) {
    return userCurrency
  }

  // If locale provided, map to currency
  if (locale?.startsWith('en-US')) return 'USD'
  if (locale?.includes('en-GB') || locale?.startsWith('de') || locale?.startsWith('fr')) {
    return 'EUR'
  }
  if (locale?.startsWith('en-IN')) return 'INR'

  // Default to INR
  return 'INR'
}
