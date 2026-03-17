import type { Subscription, BillingCycle } from './types'

// Convert any billing cycle to monthly amount
export function toMonthlyAmount(subscription: Subscription): number {
  const { amount, billingCycle } = subscription
  
  switch (billingCycle) {
    case 'daily':
      return amount * 30 // 30 days per month estimate
    case 'weekly':
      return (amount * 52) / 12 // 52 weeks per year
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

// Convert any billing cycle to yearly amount
export function toYearlyAmount(subscription: Subscription): number {
  const { amount, billingCycle } = subscription
  
  switch (billingCycle) {
    case 'daily':
      return amount * 365
    case 'weekly':
      return amount * 52
    case 'monthly':
      return amount * 12
    case 'quarterly':
      return amount * 4
    case 'yearly':
      return amount
    default:
      return amount
  }
}

// Calculate total monthly spend from subscriptions
export function calculateTotalMonthly(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)
}

// Calculate total yearly spend from subscriptions
export function calculateTotalYearly(subscriptions: Subscription[]): number {
  return subscriptions.reduce((sum, sub) => sum + toYearlyAmount(sub), 0)
}

// Format currency with INR
export function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR' || currency === '₹') {
    return `₹${amount.toLocaleString('en-US')}`
  }
  return `${currency} ${amount.toLocaleString('en-US')}`
}
