// Shared subscription calculation helpers

import type { Subscription } from '@/lib/types'

export function toMonthlyAmount(subscription: Subscription): number {
  switch (subscription.billingCycle) {
    case 'daily':
      return subscription.amount * 30
    case 'weekly':
      return (subscription.amount * 52) / 12
    case 'monthly':
      return subscription.amount
    case 'quarterly':
      return subscription.amount / 3
    case 'yearly':
      return subscription.amount / 12
    default:
      return 0
  }
}

export function toYearlyAmount(subscription: Subscription): number {
  return toMonthlyAmount(subscription) * 12
}

export function getDaysUntilRenewal(subscription: Subscription): number {
  if (!subscription.renewalDate) return -1
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const renewalDate = new Date(subscription.renewalDate)
  renewalDate.setHours(0, 0, 0, 0)
  const diffTime = renewalDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getUpcomingRenewals(subscriptions: Subscription[], days = 30): Subscription[] {
  const today = new Date()
  const nextDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000)

  return subscriptions
    .filter(sub => {
      if (!sub.renewalDate || sub.status === 'cancelled') return false
      const renewalDate = new Date(sub.renewalDate)
      return renewalDate >= today && renewalDate <= nextDate
    })
    .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime())
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
