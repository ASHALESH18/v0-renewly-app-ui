/**
 * Security Insights - Rule-based insights for account security and risk
 */

import type { Insight, InsightGenerationContext } from './insight-types'
import { createInsight } from './insight-engine'

export function generateSecurityInsights(context: InsightGenerationContext): Insight[] {
  const insights: Insight[] = []
  const { subscriptions, analytics } = context

  // INSIGHT 1: No breach monitoring connected
  insights.push(
    createInsight({
      id: 'breach_monitoring_info',
      type: 'no_breach_monitoring',
      category: 'security',
      severity: 'info',
      title: 'Breach monitoring is not connected yet',
      summary: 'Current report shows subscription exposure based on your service activity.',
      evidence: [
        'Breach monitoring backend can be connected later',
        'Current analysis: subscription health, renewal patterns, spending concentration',
        'Real breach checks protect against password leaks and service compromises',
      ],
      recommendation:
        'Use the Leak Report as a subscription exposure overview. Real breach checks can be connected later for enhanced protection.',
      actionLabel: 'View Leak Report',
      actionUrl: '/app/leak-report',
      confidence: 95,
      source: 'security',
    })
  )

  // INSIGHT 2: Elevated exposure
  const activeCount = subscriptions?.filter((s) => s.status !== 'cancelled').length || 0
  const highCostCount = subscriptions?.filter((s) => s.status !== 'cancelled' && (s.amount || 0) > 1000)
    .length || 0

  if (activeCount > 10 || highCostCount > 3) {
    const factors = []
    if (activeCount > 10) factors.push(`${activeCount} active subscription${activeCount !== 1 ? 's' : ''}`)
    if (highCostCount > 3) factors.push(`${highCostCount} high-value service${highCostCount !== 1 ? 's' : ''}`)

    insights.push(
      createInsight({
        id: 'elevated_exposure',
        type: 'elevated_exposure',
        category: 'security',
        severity: 'warning',
        title: 'Subscription exposure is elevated',
        summary: 'With many services, your account security becomes more critical.',
        evidence: [
          ...factors,
          'Multiple billing relationships increase risk surface',
          'Strong unique passwords per service recommended',
        ],
        recommendation:
          'Review high-value accounts, enable 2FA where available, and use unique strong passwords for each service.',
        actionLabel: 'View Leak Report',
        actionUrl: '/app/leak-report',
        confidence: 75,
        source: 'security',
      })
    )
  } else if (activeCount > 0 && activeCount <= 5) {
    // INSIGHT 3: Low-risk state
    insights.push(
      createInsight({
        id: 'low_exposure_state',
        type: 'low_exposure_state',
        category: 'security',
        severity: 'success',
        title: 'Your subscription exposure looks low',
        summary: 'With fewer active services, your account security is manageable.',
        evidence: [
          `${activeCount} active subscription${activeCount !== 1 ? 's' : ''}`,
          'Manageable security surface',
          'Continue practicing good password hygiene',
        ],
        recommendation:
          'Keep up with security best practices: unique passwords, 2FA where available, regular password updates.',
        actionLabel: 'View Leak Report',
        actionUrl: '/app/leak-report',
        confidence: 80,
        source: 'security',
      })
    )
  }

  return insights
}
