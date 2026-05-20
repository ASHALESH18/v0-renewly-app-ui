/**
 * Combo 2C: Renewly pricing constants and helpers
 * Centralized pricing for Pro, Family, and Extra seats
 * Safe client-side use with no server render crashes
 */

export type RenewlyCurrency = 'INR' | 'USD'

export const RENEWLY_PRICING = {
  INR: {
    currency: 'INR' as const,
    symbol: '₹',
    pro: 149,
    family: 299,
    extraSeat: 99,
  },
  USD: {
    currency: 'USD' as const,
    symbol: '$',
    pro: 4.99,
    family: 8.99,
    extraSeat: 1.49,
  },
} as const

/**
 * Get pricing for a given currency
 */
export function getRenewlyPricing(currency: RenewlyCurrency) {
  return RENEWLY_PRICING[currency]
}

/**
 * Format a plan amount with currency symbol
 * Examples: "₹149", "$4.99"
 */
export function formatPlanAmount(
  amountInr: number,
  amountUsd: number,
  currency: RenewlyCurrency
): string {
  const pricing = getRenewlyPricing(currency)
  const amount = currency === 'INR' ? amountInr : amountUsd
  return `${pricing.symbol}${amount}`
}

/**
 * Format a monthly plan label
 * Examples: "₹149/month", "$4.99/month"
 */
export function formatMonthlyLabel(
  amountInr: number,
  amountUsd: number,
  currency: RenewlyCurrency
): string {
  const formatted = formatPlanAmount(amountInr, amountUsd, currency)
  return `${formatted}/month`
}

/**
 * Get Pro plan label for current currency
 * Examples: "Renewly Pro • ₹149/month" or "Renewly Pro • $4.99/month"
 */
export function getProPriceLabel(currency: RenewlyCurrency): string {
  return `Renewly Pro • ${formatMonthlyLabel(149, 4.99, currency)}`
}

/**
 * Get Family plan label for current currency
 * Examples: "Renewly Family • ₹299/month" or "Renewly Family • $8.99/month"
 */
export function getFamilyPriceLabel(currency: RenewlyCurrency): string {
  return `Renewly Family • ${formatMonthlyLabel(299, 8.99, currency)}`
}

/**
 * Get extra seat price label for current currency
 * Examples: "₹99/month per seat" or "$1.49/month per seat"
 */
export function getExtraSeatPriceLabel(currency: RenewlyCurrency): string {
  return `${formatMonthlyLabel(99, 1.49, currency)} per seat`
}

/**
 * Get extra seat short label
 * Examples: "₹99/month" or "$1.49/month"
 */
export function getExtraSeatShortLabel(currency: RenewlyCurrency): string {
  return formatMonthlyLabel(99, 1.49, currency)
}
