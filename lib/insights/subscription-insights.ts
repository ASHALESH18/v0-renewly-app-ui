/**
 * Subscription & Renewal Insights - Rule-based insights for active subscriptions
 */

import type { Insight, InsightGenerationContext } from './insight-types'
import { createInsight } from './insight-engine'

export function generateSubscriptionInsights(context: InsightGenerationContext): Insight[] {
  const insights: Insight[] = []
  const { subscriptions, analytics } = context

  if (!subscriptions || subscriptions.length === 0) return insights

  // Filter active subscriptions only
  const activeSubscriptions = subscriptions.filter(
    (s) => s.status !== 'cancelled' && s.status !== 'paused'
  )

  // INSIGHT 1: Renewals this week
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const renewalsThisWeek = activeSubscriptions.filter((s) => {
    if (!s.renewalDate) return false
    const renewalDate = new Date(s.renewalDate)
    return renewalDate >= now && renewalDate <= weekFromNow
  })

  if (renewalsThisWeek.length > 0) {
    const topThree = renewalsThisWeek.slice(0, 3)
    const evidenceList = topThree.map((s) => {
      const days = Math.ceil((new Date(s.renewalDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return `${s.name} renews in ${days} day${days !== 1 ? 's' : ''}`
    })

    if (renewalsThisWeek.length > 3) {
      evidenceList.push(`+ ${renewalsThisWeek.length - 3} more`)
    }

    insights.push(
      createInsight({
        id: 'renewals_this_week',
        type: 'renewals_this_week',
        category: 'renewals',
        severity: 'warning',
        title: `${renewalsThisWeek.length} renewal${renewalsThisWeek.length !== 1 ? 's' : ''} this week`,
        summary: 'You have subscriptions renewing soon. Review them before they charge.',
        evidence: evidenceList,
        recommendation: 'Review upcoming renewals to avoid unexpected charges or decide to cancel.',
        actionLabel: 'View Calendar',
        actionUrl: '/app/calendar',
        confidence: 100,
        source: 'subscription_data',
      })
    )
  }

  // INSIGHT 2: Renewal due today
  const renewalToday = activeSubscriptions.find((s) => {
    if (!s.renewalDate) return false
    const renewalDate = new Date(s.renewalDate)
    const today = new Date()
    return (
      renewalDate.getFullYear() === today.getFullYear() &&
      renewalDate.getMonth() === today.getMonth() &&
      renewalDate.getDate() === today.getDate()
    )
  })

  if (renewalToday) {
    insights.push(
      createInsight({
        id: 'renewal_due_today',
        type: 'renewal_due_today',
        category: 'renewals',
        severity: 'critical',
        title: `${renewalToday.name} renews today`,
        summary: `Your ${renewalToday.name} subscription is renewing right now.`,
        evidence: [
          `Amount: ₹${renewalToday.amount?.toLocaleString('en-IN')}`,
          `Billing cycle: ${renewalToday.billingCycle}`,
        ],
        recommendation: 'If you no longer use this, cancel it immediately to avoid the charge.',
        actionLabel: 'Review Calendar',
        actionUrl: '/app/calendar',
        confidence: 100,
        source: 'subscription_data',
      })
    )
  }

  // INSIGHT 3: High-cost subscription
  if (activeSubscriptions.length >= 3) {
    const sorted = [...activeSubscriptions].sort((a, b) => (b.amount || 0) - (a.amount || 0))
    const highest = sorted[0]
    const avgOthers =
      sorted.slice(1).reduce((sum, s) => sum + (s.amount || 0), 0) / (sorted.length - 1)

    if (highest.amount && highest.amount > avgOthers * 2) {
      insights.push(
        createInsight({
          id: 'high_cost_subscription',
          type: 'high_cost_subscription',
          category: 'spend',
          severity: 'info',
          title: `${highest.name} is your highest-cost subscription`,
          summary: `This service costs significantly more than your average subscription.`,
          evidence: [
            `Cost: ₹${highest.amount.toLocaleString('en-IN')} per ${highest.billingCycle}`,
            `Average: ₹${Math.round(avgOthers).toLocaleString('en-IN')} per subscription`,
            `Difference: ${Math.round(((highest.amount - avgOthers) / avgOthers) * 100)}% above average`,
          ],
          recommendation:
            'Review whether you still actively use this service and whether it provides good value.',
          actionLabel: 'View Details',
          actionUrl: '/app/dashboard',
          confidence: 80,
          source: 'subscription_data',
        })
      )
    }
  }

  // INSIGHT 4: Possible duplicate subscription
  const nameMap = new Map<string, string[]>()
  activeSubscriptions.forEach((s) => {
    const lowerName = s.name.toLowerCase()
    const key = lowerName.split(' ')[0] // Group by first word
    if (!nameMap.has(key)) nameMap.set(key, [])
    nameMap.get(key)!.push(s.name)
  })

  for (const [key, names] of nameMap) {
    if (names.length > 1 && names.length <= 3) {
      // Possible duplicates
      insights.push(
        createInsight({
          id: `duplicate_candidate_${key}`,
          type: 'possible_duplicate',
          category: 'spend',
          severity: 'info',
          title: `Possible duplicate: ${names[0]}`,
          summary: `You have multiple subscriptions that might be the same service.`,
          evidence: names.map((n) => `• ${n}`),
          recommendation: 'Review these subscriptions to confirm they are different plans or cancel duplicates.',
          actionLabel: 'Review Dashboard',
          actionUrl: '/app/dashboard',
          confidence: 60,
          source: 'subscription_data',
        })
      )
      break // Only one duplicate insight per session
    }
  }

  // INSIGHT 5: Annual projection
  if (analytics?.projectedYearlySpend && analytics.projectedYearlySpend > 0) {
    insights.push(
      createInsight({
        id: 'annual_projection',
        type: 'annual_projection',
        category: 'spend',
        severity: 'info',
        title: `Your projected annual spend is ₹${Math.round(analytics.projectedYearlySpend).toLocaleString('en-IN')}`,
        summary: 'Based on your current active subscriptions and billing cycles.',
        evidence: [
          `${activeSubscriptions.length} active subscription${activeSubscriptions.length !== 1 ? 's' : ''}`,
          `Average monthly: ₹${Math.round(analytics.avgMonthlySpend || 0).toLocaleString('en-IN')}`,
        ],
        recommendation: 'Monitor this total regularly and look for opportunities to reduce unnecessary subscriptions.',
        actionLabel: 'View Analytics',
        actionUrl: '/app/analytics',
        confidence: 85,
        source: 'analytics',
      })
    )
  }

  return insights
}
