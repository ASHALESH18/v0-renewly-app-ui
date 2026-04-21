// Shared subscription calculation helpers

import type { Subscription } from '@/lib/types'

/**
 * Safely convert subscription to monthly amount
 * Returns 0 if amount is invalid or missing
 */
export function toMonthlyAmount(subscription: Subscription): number {
  const amount = Number(subscription.amount) || 0
  if (amount < 0 || !isFinite(amount)) return 0

  switch (subscription.billingCycle) {
    case 'daily':
      return amount * 30
    case 'weekly':
      return (amount * 52) / 12
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'yearly':
      return amount / 12
    default:
      return 0
  }
}

export function toYearlyAmount(subscription: Subscription): number {
  return toMonthlyAmount(subscription) * 12
}

/**
 * Safely calculate days until renewal
 * Returns -1 if no renewal date or invalid date
 */
export function getDaysUntilRenewal(subscription: Subscription): number {
  if (!subscription.renewalDate || typeof subscription.renewalDate !== 'string') {
    return -1
  }
  
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const renewalDate = new Date(subscription.renewalDate)
    
    // Check if date is valid
    if (isNaN(renewalDate.getTime())) {
      return -1
    }
    
    renewalDate.setHours(0, 0, 0, 0)
    const diffTime = renewalDate.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  } catch {
    return -1
  }
}

/**
 * Get subscriptions renewing within a specific number of days
 * Safely handles invalid dates and missing renewal dates
 */
export function getUpcomingRenewals(subscriptions: Subscription[], days = 30): Subscription[] {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const nextDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

    return subscriptions
      .filter(sub => {
        if (!sub.renewalDate || sub.status === 'cancelled') return false
        try {
          const renewalDate = new Date(sub.renewalDate)
          if (isNaN(renewalDate.getTime())) return false
          renewalDate.setHours(0, 0, 0, 0)
          return renewalDate >= today && renewalDate <= nextDate
        } catch {
          return false
        }
      })
      .sort((a, b) => {
        try {
          const aTime = a.renewalDate ? new Date(a.renewalDate).getTime() : Number.MAX_SAFE_INTEGER
          const bTime = b.renewalDate ? new Date(b.renewalDate).getTime() : Number.MAX_SAFE_INTEGER
          return aTime - bTime
        } catch {
          return 0
        }
      })
  } catch (error) {
    console.warn('[subscription-math] Error in getUpcomingRenewals:', error)
    return []
  }
}

export function buildCategoryBreakdown(
  subscriptions: Subscription[]
): Record<string, { count: number; monthly: number; yearly: number }> {
  const breakdown: Record<string, { count: number; monthly: number; yearly: number }> = {}

  subscriptions.forEach(sub => {
    if (sub.status === 'cancelled') return
    if (!breakdown[sub.category]) {
      breakdown[sub.category] = { count: 0, monthly: 0, yearly: 0 }
    }
    breakdown[sub.category].count++
    breakdown[sub.category].monthly += toMonthlyAmount(sub)
    breakdown[sub.category].yearly += toYearlyAmount(sub)
  })

  return breakdown
}

export function buildProjectedSpendTrend(
  subscriptions: Subscription[],
  months = 12
): Array<{ month: string; amount: number }> {
  const today = new Date()
  const trend = []

  for (let i = 0; i < months; i++) {
    const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    
    let monthlySpend = 0
    subscriptions.forEach(sub => {
      if (sub.status === 'cancelled') return
      monthlySpend += toMonthlyAmount(sub)
    })

    trend.push({ month: monthLabel, amount: monthlySpend })
  }

  return trend
}

/**
 * Calculate comprehensive subscription metrics
 * Safely handles edge cases and invalid data
 */
export function calculateMetrics(subscriptions: Subscription[]) {
  const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active')
  const unusedSubscriptions = subscriptions.filter(sub => sub.status === 'unused')
  const pausedSubscriptions = subscriptions.filter(sub => sub.status === 'paused')

  const totalMonthlySpend = subscriptions
    .filter(sub => sub.status !== 'cancelled')
    .reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)

  const unusedMonthlySpend = unusedSubscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)
  const pausedMonthlySpend = pausedSubscriptions.reduce((sum, sub) => sum + toMonthlyAmount(sub), 0)

  const leakScore = Math.min(100, Math.max(0, 100 - unusedSubscriptions.length * 10 - pausedSubscriptions.length * 5))

  return {
    activeCount: activeSubscriptions.length,
    totalCount: subscriptions.filter(sub => sub.status !== 'cancelled').length,
    totalMonthlySpend: Math.round(totalMonthlySpend * 100) / 100,
    totalYearlySpend: Math.round(totalMonthlySpend * 12 * 100) / 100,
    leakScore,
    savingsPotential: Math.round((unusedMonthlySpend + pausedMonthlySpend) * 100) / 100,
    unusedCount: unusedSubscriptions.length,
  }
}
