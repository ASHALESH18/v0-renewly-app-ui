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
  yearlyPrice?: number // for annual discount display
  yearlySavings?: number // for discount badge
  badge?: 'popular' | 'new' | 'limited'
  features: string[]
  limitations?: string[]
  cta?: string // button text
  ctaHref?: string
  color?: string
}

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    period: 'forever',
    features: [
      'Track up to 10 subscriptions',
      'Basic renewal reminders',
      'Monthly spend overview',
      'Subscription categories',
      'Export to CSV',
    ],
    limitations: [
      'Limited analytics',
      'No leak detection',
      'No multi-currency support',
      'Community support only',
    ],
    cta: 'Get started',
    ctaHref: '/auth/sign-up',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For power users and individuals',
    price: 299,
    period: 'month',
    yearlyPrice: 2499,
    yearlySavings: 300, // saves ₹300/year
    badge: 'popular',
    features: [
      'Unlimited subscriptions',
      'Advanced analytics dashboard',
      'Signature Leak Report™',
      'Multi-currency support',
      'Smart renewal calendar',
      'Custom notifications',
      'Export to CSV & JSON',
      'Priority email support',
    ],
    cta: 'Start 14-day trial',
    ctaHref: '/auth/sign-up?plan=pro',
  },
  {
    id: 'family',
    name: 'Family',
    description: 'Share with up to 4 members',
    price: 500,
    period: 'month',
    features: [
      'Everything in Pro',
      'Up to 4 family members',
      'Shared renewal calendar',
      'Family spending analytics',
      'Shared expense tracking',
      'Group notifications',
      'Household dashboard',
      'Family reports',
    ],
    cta: 'Start 14-day trial',
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
      'Team-level analytics & reporting',
      'Admin controls & permissions',
      'Audit logs & compliance',
      'SSO & SCIM (coming soon)',
      'Dedicated account manager',
      'Priority support with SLA',
      '99.9% uptime SLA',
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
