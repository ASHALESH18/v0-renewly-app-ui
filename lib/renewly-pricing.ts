/**
 * Renewly Plan Pricing Utility - Combo 2A
 * Single source of truth for Renewly Pro/Family/Extra pricing with INR/USD support
 */

import type { CurrencyCode } from './currency'
import { normalizeCurrencyCode, getCurrencySymbol } from './currency'
import { getCurrencyFromCountry, getCurrencyFromLocale } from './currency'
import type { Subscription } from './types'

export type RenewlyCurrency = 'INR' | 'USD'

export interface RenewlyPricing {
  pro: Record<RenewlyCurrency, number>
  family: Record<RenewlyCurrency, number>
  extraSeat: Record<RenewlyCurrency, number>
}

export const RENEWLY_PRICING: RenewlyPricing = {
  pro: {
    INR: 149,
    USD: 4.99,
  },
  family: {
    INR: 299,
    USD: 8.99,
  },
  extraSeat: {
    INR: 99,
    USD: 1.49,
  },
}

/**
 * Resolve user's preferred currency for Renewly pricing
 * Priority: subscription → profile → country → locale → fallback
 */
export function resolveRenewlyCurrency(input?: {
  subscriptionCurrency?: string | null
  profileCurrency?: string | null
  countryCode?: string | null
  locale?: string | null
  serverCountry?: string | null
}): RenewlyCurrency {
  if (!input) return 'INR'

  // A: Existing subscription currency (if available)
  if (input.subscriptionCurrency) {
    const normalized = normalizeCurrencyCode(input.subscriptionCurrency)
    if (normalized === 'INR' || normalized === 'USD') return normalized
  }

  // B: User/profile explicit currency
  if (input.profileCurrency) {
    const normalized = normalizeCurrencyCode(input.profileCurrency)
    if (normalized === 'INR' || normalized === 'USD') return normalized
  }

  // C: Server/Vercel country header (Renewly uses this in API)
  if (input.serverCountry) {
    const serverCurrency = getCurrencyFromCountry(input.serverCountry)
    if (serverCurrency === 'INR' || serverCurrency === 'USD') return serverCurrency
  }

  // D: Browser locale/timezone fallback
  if (input.locale) {
    const localeCurrency = getCurrencyFromLocale(input.locale)
    if (localeCurrency === 'INR' || localeCurrency === 'USD') return localeCurrency
  }

  // E: Safe fallback - INR for Indian regions, USD otherwise
  if (input.countryCode === 'IN') return 'INR'

  return 'USD'
}

/**
 * Get Renewly plan price for given currency
 */
export function getRenewlyPlanPrice(plan: 'pro' | 'family', currency: RenewlyCurrency): number {
  return RENEWLY_PRICING[plan][currency] || RENEWLY_PRICING[plan]['USD']
}

/**
 * Get Renewly extra seat price
 */
export function getExtraSeatPrice(currency: RenewlyCurrency): number {
  return RENEWLY_PRICING.extraSeat[currency] || RENEWLY_PRICING.extraSeat['USD']
}

/**
 * Format Renewly money amount with symbol and proper decimal places
 */
export function formatRenewlyMoney(amount: number | null | undefined, currency: RenewlyCurrency): string {
  if (amount === null || amount === undefined) {
    return `${currency === 'INR' ? '₹' : '$'}0`
  }

  const symbol = currency === 'INR' ? '₹' : '$'
  const formatted =
    currency === 'INR'
      ? Math.round(amount).toString()
      : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return `${symbol}${formatted}`
}

/**
 * Format Renewly monthly pricing display
 */
export function formatRenewlyMonthly(amount: number | null | undefined, currency: RenewlyCurrency): string {
  const formatted = formatRenewlyMoney(amount, currency)
  return `${formatted}/month`
}

/**
 * Format Renewly yearly pricing display
 */
export function formatRenewlyYearly(amount: number | null | undefined, currency: RenewlyCurrency): string {
  if (!amount) return 'Free'
  const yearly = currency === 'INR' ? amount * 12 : amount * 12
  return formatRenewlyMoney(yearly, currency)
}

/**
 * Calculate Family plan total with extra seats
 * Clamped to max 4 extra seats per F7.4-S
 */
export function calculateFamilyTotal(
  baseSeats: number,
  extraSeats: number,
  currency: RenewlyCurrency
): number {
  const base = getRenewlyPlanPrice('family', currency)
  const extra = getExtraSeatPrice(currency)
  // F7.4-S: Clamp to max 4 extra seats
  const clamped = Math.min(extraSeats, 4)
  return base + clamped * extra
}

/**
 * Format Family plan total display
 * E.g., "₹299 base + ₹99 × 2 = ₹497/month"
 */
export function formatFamilyTotal(
  extraSeats: number,
  currency: RenewlyCurrency,
  format: 'full' | 'compact' = 'full'
): string {
  const base = getRenewlyPlanPrice('family', currency)
  const extra = getExtraSeatPrice(currency)
  const clamped = Math.min(extraSeats, 4)

  if (format === 'compact') {
    const total = calculateFamilyTotal(1, extraSeats, currency)
    return formatRenewlyMonthly(total, currency)
  }

  // Full format with breakdown
  const baseFormatted = formatRenewlyMoney(base, currency)
  if (clamped === 0) {
    return `${baseFormatted} base/month`
  }
  const extraFormatted = formatRenewlyMoney(extra, currency)
  const totalFormatted = formatRenewlyMoney(calculateFamilyTotal(1, extraSeats, currency), currency)
  return `${baseFormatted} base + ${extraFormatted} × ${clamped} = ${totalFormatted}/month`
}

/**
 * Check if given subscription is a managed Renewly row
 */
export function isManagedRenewlySubscription(sub: Subscription | any): boolean {
  if (!sub) return false
  return sub.is_system_managed === true || sub.system_source?.includes('renewly') || sub.name?.includes('Renewly')
}

/**
 * Get display name for Renewly plan
 */
export function getRenewlyPlanName(plan: 'pro' | 'family'): string {
  return plan === 'pro' ? 'Renewly Pro' : 'Renewly Family'
}

/**
 * Preview QA helper - Allow localStorage override for testing
 * Only works on localhost or Vercel preview domains
 */
export function getQACurrencyOverride(): RenewlyCurrency | null {
  if (typeof window === 'undefined') return null

  const isPreview =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname.includes('.vercel.app'))

  if (!isPreview) return null

  const override = localStorage.getItem('renewly_currency_override')
  if (override === 'INR' || override === 'USD') {
    return override
  }

  return null
}

/**
 * Get effective currency with QA override support
 */
export function getEffectiveRenewlyCurrency(input?: {
  subscriptionCurrency?: string | null
  profileCurrency?: string | null
  countryCode?: string | null
  locale?: string | null
  serverCountry?: string | null
}): RenewlyCurrency {
  // Check QA override first
  const qaOverride = getQACurrencyOverride()
  if (qaOverride) return qaOverride

  // Otherwise resolve normally
  return resolveRenewlyCurrency(input)
}
