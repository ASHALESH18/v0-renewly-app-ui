/**
 * Pricing display utilities - Single source of truth for pricing across paywall and pricing pages
 * Supports multi-currency display: INR, USD, EUR
 */

import { getPlan, getPlanPricing, type PlanCurrency } from './plans'
import { getCurrencySymbol } from './locale-utils'

export interface PricingDisplay {
  amount: number | null
  currency: string
  symbol: string
  period: string
  displayText: string // e.g., "From ₹149/month"
  originalAmount?: number
  savings?: number
}

/**
 * Get pricing for a plan with currency localization
 */
export function getPricingForPaywall(
  planId: 'pro' | 'family' | 'enterprise' = 'pro',
  currencyCode: PlanCurrency = 'INR'
): PricingDisplay {
  const plan = getPlan(planId)
  if (!plan) {
    return {
      amount: null,
      currency: currencyCode,
      symbol: getCurrencySymbol(currencyCode),
      period: 'month',
      displayText: 'Contact for pricing',
    }
  }

  const pricing = getPlanPricing(planId, currencyCode)
  if (!pricing) {
    return {
      amount: null,
      currency: currencyCode,
      symbol: getCurrencySymbol(currencyCode),
      period: 'month',
      displayText: 'Contact for pricing',
    }
  }

  const symbol = getCurrencySymbol(currencyCode)

  if (pricing.amount === null) {
    return {
      amount: null,
      currency: currencyCode,
      symbol,
      period: pricing.period,
      displayText: pricing.priceText || 'Custom pricing',
    }
  }

  if (pricing.amount === 0) {
    return {
      amount: 0,
      currency: currencyCode,
      symbol,
      period: pricing.period,
      displayText: 'Free',
    }
  }

  return {
    amount: pricing.amount,
    currency: currencyCode,
    symbol,
    period: pricing.period,
    displayText: `From ${symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}/${pricing.period}`,
    originalAmount: pricing.originalAmount,
    savings: pricing.savings,
  }
}

/**
 * Format currency symbol - centralized to avoid duplication
 */
export { getCurrencySymbol } from './locale-utils'

/**
 * Get user's selected currency, with fallbacks
 */
export function getEffectiveCurrency(
  userCurrency?: string,
  locale?: string
): PlanCurrency {
  // If explicitly set to a supported currency, use it
  if (userCurrency === 'INR' || userCurrency === 'USD' || userCurrency === 'EUR') {
    return userCurrency as PlanCurrency
  }

  // If locale provided, map to currency
  if (locale?.startsWith('en-US')) return 'USD'
  if (locale?.includes('en-GB') || locale?.startsWith('de') || locale?.startsWith('fr')) {
    return 'EUR'
  }
  if (locale?.startsWith('en-IN') || locale?.startsWith('hi')) return 'INR'

  // Default to INR
  return 'INR'
}
