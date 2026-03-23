/**
 * Central Plan Registry - Single source of truth for all plans
 * Used across: pricing, settings, plan sheets, homepage, marketing pages
 */

export type PlanType = 'free' | 'pro' | 'family' | 'enterprise'

export interface Plan {
  id: PlanType
  name: string
  description: string
  price: number | null // null for custom pricing
  period: 'forever' | 'month' | 'year'
  priceText?: string // e.g., "Custom pricing"
  originalPrice?: number // for struck-through old price display
  savings?: number // savings amount to display (e.g., 150 for "Save ₹150/month")
  yearlyPrice?: number // for annual discount display
  yearlySavings?: number // for discount badge
  badge?: 'popular' | 'new' | 'limited'
  features: string[]
  limitations?: string[]
  cta?: string // button text
  ctaHref?: string
  color?: string
  extraNote?: string // e.g., "+₹99/member/month after 4"
}

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'For getting started',
    price: 0,
    period: 'forever',
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
    ctaHref: '/auth/sign-up',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For individuals',
    price: 149,
    originalPrice: 299,
    savings: 150,
    period: 'month',
    badge: 'popular',
    features: [
      'Unlimited subscriptions',
      'Advanced analytics',
      'Signature Leak Report',
      'Multi-currency support',
      'Smart renewal calendar',
      'Export to CSV / JSON',
      'Priority support',
    ],
    cta: 'Get started',
    ctaHref: '/auth/sign-up?plan=pro',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'For up to 4 members',
    price: 299,
    originalPrice: 499,
    savings: 200,
    period: 'month',
    extraNote: '+₹99/member/month after 4 members',
    features: [
      'Everything in Pro',
      'Up to 4 family members included',
      'Shared renewal calendar',
      'Shared household dashboard',
      'Shared notifications',
      'Shared expense tracking',
      'Family reports',
    ],
    cta: 'Get started',
    ctaHref: '/auth/sign-up?plan=family',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For teams and organizations',
    price: null,
    period: 'month',
    priceText: 'Custom pricing',
    features: [
      'Everything in Pro',
      'Organization workspace',
      'Unlimited team members',
      'Team analytics & reporting',
      'Admin controls & permissions',
      'Audit logs & compliance',
      'SSO & SCIM (coming soon)',
      'Dedicated support',
    ],
    cta: 'Contact Sales',
    ctaHref: '/contact-sales',
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
 * Get display price string
 */
export function getPriceString(plan: Plan): string {
  if (plan.price === null) {
    return plan.priceText || 'Custom'
  }
  if (plan.price === 0) {
    return '₹0'
  }
  return `₹${plan.price.toLocaleString('en-IN')}`
}

/**
 * Format plan for display with currency
 */
export function formatPlan(id: PlanType, currency: string = 'INR'): string {
  const plan = getPlan(id)
  if (!plan) return id
  
  const name = plan.name
  if (plan.price === null) {
    return `${name} (Custom)`
  }
  if (plan.price === 0) {
    return `${name} (Free)`
  }
  
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency
  return `${name} (${symbol}${plan.price}/${plan.period})`
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
