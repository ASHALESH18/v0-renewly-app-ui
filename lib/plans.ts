/**
 * Central Plan Registry - Single source of truth for all plans
 * Supports multi-currency pricing: INR, USD, EUR
 * Used across: pricing, settings, plan sheets, homepage, marketing pages
 */

export type PlanType = 'free' | 'pro' | 'family' | 'enterprise'
export type PlanCurrency = 'INR' | 'USD' | 'EUR'

export interface PlanPricing {
  amount: number | null // null for custom pricing
  period: 'forever' | 'month' | 'year'
  priceText?: string // e.g., "Custom pricing"
  originalAmount?: number
  savings?: number
}

export interface Plan {
  id: PlanType
  name: string
  description: string
  priceINR: PlanPricing
  priceUSD: PlanPricing
  priceEUR: PlanPricing
  badge?: 'popular' | 'new' | 'limited'
  features: string[]
  limitations?: string[]
  cta?: string // button text
  ctaHref?: string
  color?: string
  extraNote?: string
}

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For getting started',
    priceINR: { amount: 0, period: 'forever' },
    priceUSD: { amount: 0, period: 'forever' },
    priceEUR: { amount: 0, period: 'forever' },
    features: [
      'Track up to 2 subscriptions',
      'Basic reminders',
      'Manual entry only',
    ],
    limitations: [
      'No advanced analytics',
      'No Leak Report',
      'No multi-currency support',
    ],
    cta: 'Get started',
    ctaHref: '/auth/sign-in?next=/app/dashboard',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Best for individuals',
    priceINR: { amount: 149, period: 'month', originalAmount: 299, savings: 150 },
    priceUSD: { amount: 4.99, period: 'month', originalAmount: 9.99, savings: 5 },
    priceEUR: { amount: 4.99, period: 'month', originalAmount: 9.99, savings: 5 },
    badge: 'popular',
    features: [
      'Unlimited subscriptions',
      'Smart renewal tracking',
      'Advanced insights & analytics',
      'Signature Leak Report',
      'Multi-currency support',
      'Renewal calendar & reminders',
      'Export to CSV / JSON',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    ctaHref: '/auth/sign-in?next=/app/upgrade?plan=pro',
  },
  {
    id: 'family',
    name: 'Renewly Family',
    description: 'Best for households',
    priceINR: { amount: 299, period: 'month', originalAmount: 499, savings: 200 },
    priceUSD: { amount: 8.99, period: 'month', originalAmount: 14.99, savings: 6 },
    priceEUR: { amount: 8.99, period: 'month', originalAmount: 14.99, savings: 6 },
    extraNote: 'Includes owner + 4 invited members. Add up to 4 extra members at ₹99/month or $1.49/month each.',
    features: [
      'Everything in Pro',
      'Owner + 4 invited family members',
      'Shared subscription tracking',
      'Shared renewal calendar',
      'Shared household dashboard',
      'Shared notifications',
      'Shared expense tracking',
      'Family spending reports',
      'Extra members: +4 × ₹99/month or +4 × $1.49/month',
      'Maximum owner + 8 invited members',
    ],
    cta: 'Upgrade to Renewly Family',
    ctaHref: '/auth/sign-in?next=/app/upgrade?plan=family',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Best for teams & businesses',
    priceINR: { amount: null, period: 'month', priceText: 'Custom pricing' },
    priceUSD: { amount: null, period: 'month', priceText: 'Custom pricing' },
    priceEUR: { amount: null, period: 'month', priceText: 'Custom pricing' },
    features: [
      'Everything in Pro',
      'Unlimited team members',
      'Shared workspace & visibility',
      'Team analytics & reporting',
      'Advanced admin controls',
      'Audit logs & compliance',
      'Custom integrations',
      'Dedicated support',
      'SSO & SCIM coming soon',
    ],
    cta: 'Contact Sales',
    ctaHref: '/auth/sign-in?next=/app/upgrade?plan=enterprise',
  },
]

/**
 * Get a plan by ID
 */
export function getPlan(id: PlanType): Plan | undefined {
  return plans.find((plan) => plan.id === id)
}

/**
 * Get all plans
 */
export function getAllPlans(): Plan[] {
  return plans
}

/**
 * Get pricing for a plan in a specific currency
 * Falls back to USD if currency not supported
 */
export function getPlanPricing(id: PlanType, currency: PlanCurrency = 'INR'): PlanPricing | undefined {
  const plan = getPlan(id)
  if (!plan) return undefined

  const key = `price${currency}` as const
  const pricing = plan[key]

  // Fallback to USD if currency not supported
  if (!pricing && currency !== 'USD') {
    return plan.priceUSD
  }

  return pricing
}

/**
 * Format plan for display with currency
 */
export function formatPlan(id: PlanType, currency: PlanCurrency = 'INR'): string {
  const plan = getPlan(id)
  if (!plan) return id

  const pricing = getPlanPricing(id, currency)
  if (!pricing) return plan.name

  const name = plan.name
  if (pricing.amount === null) {
    return `${name} (${pricing.priceText || 'Custom'})`
  }
  if (pricing.amount === 0) {
    return `${name} (Free)`
  }

  const symbols: Record<PlanCurrency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currency]
  return `${name} (${symbol}${pricing.amount}/${pricing.period})`
}

/**
 * Get display price string for a plan
 */
export function getPriceString(plan: Plan, currency: PlanCurrency = 'INR'): string {
  const pricing = getPlanPricing(plan.id, currency)
  if (!pricing) return ''

  if (pricing.amount === null) {
    return pricing.priceText || 'Custom'
  }
  if (pricing.amount === 0) {
    return 'Free'
  }

  const symbols: Record<PlanCurrency, string> = {
    INR: '₹',
    USD: '$',
    EUR: '€',
  }

  const symbol = symbols[currency]
  return `${symbol}${pricing.amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/**
 * Map old "premium" value to "pro" for backwards compatibility
 */
export function normalizePlanType(plan: any): PlanType {
  if (plan === 'premium') {
    return 'pro'
  }
  if (plan === 'free' || plan === 'pro' || plan === 'family' || plan === 'enterprise') {
    return plan as PlanType
  }
  return 'free'
}
