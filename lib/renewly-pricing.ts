/**
 * Combo 2: Renewly Plan Pricing Resolver
 * Single source of truth for Renewly Pro/Family/Extra pricing with consistent currency handling
 * 
 * Pricing structure:
 * - Renewly Pro: ₹149/month (INR) | $4.99/month (USD)
 * - Renewly Family base: ₹299/month (INR) | $8.99/month (USD)
 * - Extra member: ₹99/month (INR) | $1.49/month (USD)
 */

import { CurrencyCode, normalizeCurrencyCode, getCurrencySymbol, formatCurrencyAmount } from './currency'
import type { Subscription } from './types'

export type RenewlyPlan = 'pro' | 'family'

/**
 * Get base price for Renewly plan in specified currency
 */
export function getRenewlyPlanPrice(plan: RenewlyPlan, currency: string): number {
  const normalized = normalizeCurrencyCode(currency)
  
  if (plan === 'pro') {
    return normalized === 'USD' ? 4.99 : normalized === 'EUR' ? 4.99 : 149 // INR default
  }
  
  if (plan === 'family') {
    return normalized === 'USD' ? 8.99 : normalized === 'EUR' ? 8.99 : 299 // INR default
  }
  
  return 0
}

/**
 * Get extra member/seat price in specified currency
 */
export function getExtraMemberPrice(currency: string): number {
  const normalized = normalizeCurrencyCode(currency)
  return normalized === 'USD' ? 1.49 : normalized === 'EUR' ? 1.49 : 99 // INR default
}

/**
 * Calculate total Family plan monthly cost including extra seats
 */
export function getRenewlyFamilyTotal(params: {
  currency: string
  extraSeatCount?: number
  reconciledExtraCount?: number // Use this if available (from F7.4-S2)
}): number {
  const { currency, extraSeatCount = 0, reconciledExtraCount } = params
  const basePrice = getRenewlyPlanPrice('family', currency)
  const extraPrice = getExtraMemberPrice(currency)
  const seatsToCount = reconciledExtraCount ?? extraSeatCount
  const clampedSeats = Math.min(seatsToCount, 4) // Max 4 extra seats (F7.4-S clamping)
  return basePrice + clampedSeats * extraPrice
}

/**
 * Format Renewly plan price for display
 */
export function formatRenewlyPlanPrice(
  plan: RenewlyPlan,
  currency: string,
  options?: { showSymbol?: boolean; showPeriod?: boolean }
): string {
  const { showSymbol = true, showPeriod = true } = options ?? {}
  const amount = getRenewlyPlanPrice(plan, currency)
  const symbol = showSymbol ? getCurrencySymbol(currency) : ''
  const period = showPeriod ? '/month' : ''
  
  return `${symbol}${formatAmount(amount, currency)}${period}`
}

/**
 * Format extra member price for display
 */
export function formatExtraMemberPrice(
  currency: string,
  options?: { showSymbol?: boolean; showPeriod?: boolean }
): string {
  const { showSymbol = true, showPeriod = true } = options ?? {}
  const amount = getExtraMemberPrice(currency)
  const symbol = showSymbol ? getCurrencySymbol(currency) : ''
  const period = showPeriod ? '/month' : ''
  
  return `${symbol}${formatAmount(amount, currency)}${period}`
}

/**
 * Format Family plan total with extra seats
 */
export function formatRenewlyFamilyTotal(params: {
  currency: string
  extraSeatCount?: number
  reconciledExtraCount?: number
  showSymbol?: boolean
  showPeriod?: boolean
  yearly?: boolean // If true, multiply by 12
}): string {
  const { currency, showSymbol = true, showPeriod = true, yearly = false } = params
  const monthly = getRenewlyFamilyTotal(params)
  const amount = yearly ? monthly * 12 : monthly
  const symbol = showSymbol ? getCurrencySymbol(currency) : ''
  const period = showPeriod ? (yearly ? '/year' : '/month') : ''
  
  return `${symbol}${formatAmount(amount, currency)}${period}`
}

/**
 * Get user's currency preference
 * Priority: profile currency > subscription currency > fallback INR
 */
export async function getUserCurrencyPreference(params: {
  profileCurrency?: string | null
  subscriptionCurrency?: string | null
  authUserLocale?: string | null
}): Promise<CurrencyCode> {
  const { profileCurrency, subscriptionCurrency, authUserLocale } = params
  
  // 1. Profile explicitly set currency
  if (profileCurrency === 'INR' || profileCurrency === 'USD' || profileCurrency === 'EUR') {
    return profileCurrency as CurrencyCode
  }
  
  // 2. Subscription currency (if managing a paid subscription)
  if (subscriptionCurrency === 'INR' || subscriptionCurrency === 'USD' || subscriptionCurrency === 'EUR') {
    return subscriptionCurrency as CurrencyCode
  }
  
  // 3. Locale hint
  if (authUserLocale) {
    if (authUserLocale.startsWith('en-IN') || authUserLocale.startsWith('hi')) return 'INR'
    if (authUserLocale.startsWith('de') || authUserLocale.startsWith('fr') || authUserLocale.startsWith('es')) return 'EUR'
    if (authUserLocale.startsWith('en-US') || authUserLocale.startsWith('en')) return 'USD'
  }
  
  // 4. Fallback for QA users: INR
  return 'INR'
}

/**
 * Helper: Format a number for specific currency
 */
function formatAmount(amount: number, currency: string): string {
  const normalized = normalizeCurrencyCode(currency)
  const fractionDigits = normalized === 'JPY' ? 0 : 2
  return amount.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })
}

/**
 * Get copy for Renewly plan
 */
export function getRenewlyPlanCopy(plan: RenewlyPlan): { name: string; ctaText: string } {
  if (plan === 'family') {
    return {
      name: 'Renewly Family',
      ctaText: 'Upgrade to Renewly Family',
    }
  }
  
  return {
    name: 'Renewly Pro',
    ctaText: 'Upgrade to Pro',
  }
}

/**
 * Determine if a subscription is a managed Renewly plan
 */
export function isManagedRenewlyPlan(subscription?: Pick<Subscription, 'plan' | 'system_managed' | 'system_source'> | null): boolean {
  if (!subscription) return false
  return (subscription.system_managed === true) && 
         (subscription.system_source === 'family_owner' || subscription.system_source === 'family_member' || subscription.system_source === 'family_conversion' || subscription.plan === 'family' || subscription.plan === 'pro')
}

/**
 * Get display copy for Family member status
 */
export function getFamilyMemberStatusCopy(status: 'active' | 'pending' | 'removed' | 'cancelled'): {
  label: string
  subtitle: string
} {
  switch (status) {
    case 'active':
      return {
        label: 'Renewly Family Member',
        subtitle: 'Covered by Family owner',
      }
    case 'pending':
      return {
        label: 'Invite Pending',
        subtitle: 'Accept invite to join family',
      }
    case 'removed':
    case 'cancelled':
      return {
        label: 'Family Access Ended',
        subtitle: 'Start your own plan to continue',
      }
    default:
      return {
        label: 'Family Member',
        subtitle: '',
      }
  }
}
