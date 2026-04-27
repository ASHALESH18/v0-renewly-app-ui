/**
 * Pricing display utilities - Single source of truth for pricing across paywall and pricing pages.
 * Dedicated plan prices currently exist for INR, USD, and EUR.
 * Any other selected app currency falls back to USD for plan pricing to avoid mixed INR UI.
 */

import { getPlan, getPlanPricing, type PlanCurrency } from './plans'
import { getCurrencySymbol } from './currency'

export interface PricingDisplay {
  amount: number | null
  currency: PlanCurrency
  symbol: string
  period: string
  displayText: string
  originalAmount?: number
  savings?: number
}

export function getEffectiveCurrency(
  userCurrency?: string,
  locale?: string
): PlanCurrency {
  if (userCurrency === 'INR' || userCurrency === 'USD' || userCurrency === 'EUR') {
    return userCurrency
  }

  if (locale?.startsWith('en-IN') || locale?.startsWith('hi')) return 'INR'
  if (
    locale?.startsWith('de') ||
    locale?.startsWith('fr') ||
    locale?.startsWith('es') ||
    locale?.startsWith('it') ||
    locale?.startsWith('nl')
  ) {
    return 'EUR'
  }

  return 'USD'
}

export function getPricingForPaywall(
  planId: 'pro' | 'family' | 'enterprise' = 'pro',
  currencyCode: PlanCurrency = 'INR'
): PricingDisplay {
  const effectiveCurrency = getEffectiveCurrency(currencyCode)
  const plan = getPlan(planId)
  const symbol = getCurrencySymbol(effectiveCurrency)

  if (!plan) {
    return {
      amount: null,
      currency: effectiveCurrency,
      symbol,
      period: 'month',
      displayText: 'Contact for pricing',
    }
  }

  const pricing = getPlanPricing(planId, effectiveCurrency)

  if (!pricing || pricing.amount === null) {
    return {
      amount: null,
      currency: effectiveCurrency,
      symbol,
      period: pricing?.period || 'month',
      displayText: pricing?.priceText || 'Custom pricing',
    }
  }

  if (pricing.amount === 0) {
    return {
      amount: 0,
      currency: effectiveCurrency,
      symbol,
      period: pricing.period,
      displayText: 'Free',
    }
  }

  const amount = pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })

  return {
    amount: pricing.amount,
    currency: effectiveCurrency,
    symbol,
    period: pricing.period,
    displayText: `From ${symbol}${amount} ${effectiveCurrency}/${pricing.period}`,
    originalAmount: pricing.originalAmount,
    savings: pricing.savings,
  }
}

export { getCurrencySymbol } from './currency'
