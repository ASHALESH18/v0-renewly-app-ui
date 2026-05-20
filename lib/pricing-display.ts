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


export type RenewlyBillingCurrency = 'INR' | 'USD'

export const RENEWLY_MONTHLY_PRICES: Record<RenewlyBillingCurrency, { pro: number; family: number; extraMember: number }> = {
  INR: { pro: 149, family: 299, extraMember: 99 },
  USD: { pro: 4.99, family: 8.99, extraMember: 1.49 },
}

export function resolveRenewlyBillingCurrency(
  currency?: string | null,
  locale?: string | null,
  countryCode?: string | null
): RenewlyBillingCurrency {
  const normalized = String(currency || '').trim().toUpperCase()
  if (normalized === 'INR' || normalized === '₹') return 'INR'
  if (normalized === 'USD' || normalized === '$' || normalized === 'US$') return 'USD'

  const country = String(countryCode || '').trim().toUpperCase()
  if (country === 'IN') return 'INR'

  const loc = String(locale || '').trim().toLowerCase()
  if (loc === 'hi' || loc.startsWith('hi-') || loc === 'en-in' || loc.startsWith('en-in')) return 'INR'

  // Current QA/default remains INR. International users can be switched to USD through profile/settings currency.
  return 'INR'
}

export function getRenewlyPlanMonthlyAmount(
  plan: 'pro' | 'family',
  currency?: string | null
): number {
  const resolved = resolveRenewlyBillingCurrency(currency)
  return RENEWLY_MONTHLY_PRICES[resolved][plan]
}

export function getRenewlyExtraMemberMonthlyAmount(currency?: string | null): number {
  const resolved = resolveRenewlyBillingCurrency(currency)
  return RENEWLY_MONTHLY_PRICES[resolved].extraMember
}

export function formatRenewlyMoney(
  amount: number,
  currency?: string | null,
  language = 'en'
): string {
  const resolved = resolveRenewlyBillingCurrency(currency)
  return formatCurrencyAmount(amount, resolved, language, {
    maximumFractionDigits: resolved === 'INR' ? 0 : 2,
  })
}

export function formatRenewlyMonthlyAmount(
  amount: number,
  currency?: string | null,
  language = 'en'
): string {
  return `${formatRenewlyMoney(amount, currency, language)}/month`
}

export function formatRenewlyPlanMonthly(
  plan: 'pro' | 'family',
  currency?: string | null,
  language = 'en'
): string {
  return formatRenewlyMonthlyAmount(getRenewlyPlanMonthlyAmount(plan, currency), currency, language)
}

export function formatRenewlyExtraMemberMonthly(currency?: string | null, language = 'en'): string {
  return formatRenewlyMonthlyAmount(getRenewlyExtraMemberMonthlyAmount(currency), currency, language)
}

export function getRenewlyFamilyTotalMonthlyAmount(
  extraSeatCount = 0,
  currency?: string | null
): number {
  const resolved = resolveRenewlyBillingCurrency(currency)
  const clampedExtraSeats = Math.min(Math.max(0, Number(extraSeatCount || 0)), 4)
  return RENEWLY_MONTHLY_PRICES[resolved].family + clampedExtraSeats * RENEWLY_MONTHLY_PRICES[resolved].extraMember
}
