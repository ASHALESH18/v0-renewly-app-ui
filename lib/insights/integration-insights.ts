/**
 * Integration Insights - Rule-based insights for connection status
 */

import type { Insight, InsightGenerationContext } from './insight-types'
import { createInsight } from './insight-engine'

export function generateIntegrationInsights(context: InsightGenerationContext): Insight[] {
  const insights: Insight[] = []
  const { integrations, candidates } = context

  if (!integrations || integrations.length === 0) return insights

  // INSIGHT 1: Gmail not connected
  const gmailConnected = integrations.some((i) => i.name === 'Gmail' && i.connected)

  if (!gmailConnected && (!candidates || candidates.length === 0)) {
    insights.push(
      createInsight({
        id: 'gmail_not_connected',
        type: 'gmail_not_connected',
        category: 'integrations',
        severity: 'info',
        title: 'Connect Gmail to unlock Smart Inbox',
        summary: 'Email integration helps Renewly automatically detect subscription signals.',
        evidence: [
          'Gmail is not connected yet',
          'Smart Inbox will auto-detect renewals, trial endings, price increases',
          'You control what gets added - no auto-subscriptions',
        ],
        recommendation:
          'Connect Gmail to start receiving subscription signals. You review and decide what to add.',
        actionLabel: 'Connect Integrations',
        actionUrl: '/app/integrations',
        confidence: 80,
        source: 'integrations',
      })
    )
  }

  // INSIGHT 2: Calendar suggestion for many renewals
  if (context.analytics?.renewalCount && context.analytics.renewalCount > 5) {
    insights.push(
      createInsight({
        id: 'calendar_sync_suggestion',
        type: 'calendar_sync_suggestion',
        category: 'integrations',
        severity: 'info',
        title: 'Sync renewals to your calendar',
        summary: 'You have many upcoming renewals. Calendar sync can help you stay on top of them.',
        evidence: [
          `${context.analytics.renewalCount} subscriptions renewing soon`,
          'Calendar reminders help prevent missed cancellations',
        ],
        recommendation:
          'Enable calendar sync to get reminder notifications for upcoming subscription renewals.',
        actionLabel: 'View Integrations',
        actionUrl: '/app/integrations',
        confidence: 70,
        source: 'integrations',
      })
    )
  }

  // INSIGHT 3: Integration needs attention
  const needsAttention = integrations.filter(
    (i) => i.status === 'needs_attention' || i.status === 'disconnected'
  )

  if (needsAttention.length > 0) {
    const integrationsText = needsAttention.map((i) => i.name).join(', ')

    insights.push(
      createInsight({
        id: 'integrations_need_attention',
        type: 'integration_needs_attention',
        category: 'integrations',
        severity: 'warning',
        title: `${integrationsText} need${needsAttention.length === 1 ? 's' : ''} attention`,
        summary: 'Some of your integrations are disconnected or need to be re-authorized.',
        evidence: [
          `${needsAttention.map((i) => i.name).join(', ')} ${needsAttention.length === 1 ? 'is' : 'are'} not active`,
          'This may affect Smart Inbox detection and renewal alerts',
        ],
        recommendation: 'Reconnect these integrations to continue receiving subscription signals.',
        actionLabel: 'Fix Integrations',
        actionUrl: '/app/integrations',
        confidence: 95,
        source: 'integrations',
      })
    )
  }

  return insights
}
