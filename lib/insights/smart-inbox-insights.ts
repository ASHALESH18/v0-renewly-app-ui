/**
 * Smart Inbox Insights - Rule-based insights for detected candidates
 */

import type { Insight, InsightGenerationContext } from './insight-types'
import { createInsight } from './insight-engine'

export function generateSmartInboxInsights(context: InsightGenerationContext): Insight[] {
  const insights: Insight[] = []
  const { candidates, subscriptions } = context

  if (!candidates || candidates.length === 0) return insights

  // Filter high-confidence candidates (ready to add)
  const highConfidence = candidates.filter((c) => (c.confidence ?? 0) >= 75)

  if (highConfidence.length > 0) {
    const topThree = highConfidence.slice(0, 3)
    const evidenceList = topThree.map((c) => {
      const confidence = Math.round(c.confidence ?? 0)
      return `${c.name} (${confidence}% confidence)`
    })

    if (highConfidence.length > 3) {
      evidenceList.push(`+ ${highConfidence.length - 3} more`)
    }

    insights.push(
      createInsight({
        id: 'ready_to_add_candidates',
        type: 'ready_to_add_candidates',
        category: 'smart_inbox',
        severity: 'info',
        title: `${highConfidence.length} subscription signal${highConfidence.length !== 1 ? 's' : ''} ready to review`,
        summary: 'High-confidence subscription detections waiting for your confirmation.',
        evidence: evidenceList,
        recommendation: 'Review these signals and add confirmed subscriptions to your tracking.',
        actionLabel: 'Review Smart Inbox',
        actionUrl: '/app/smart-inbox',
        confidence: 90,
        source: 'smart_inbox',
      })
    )
  }

  // Possible duplicate candidate
  if (subscriptions) {
    for (const candidate of candidates.slice(0, 5)) {
      const existingMatch = subscriptions.some(
        (s) => s.name.toLowerCase() === candidate.name.toLowerCase()
      )

      if (existingMatch) {
        insights.push(
          createInsight({
            id: `duplicate_candidate_${candidate.id}`,
            type: 'possible_duplicate_candidate',
            category: 'smart_inbox',
            severity: 'warning',
            title: `Possible duplicate: ${candidate.name}`,
            summary: 'This detected subscription might already be tracked.',
            evidence: [
              `Detected: ${candidate.name}`,
              'You already have a similar subscription in your list',
              'Could be a renewal notification or duplicate',
            ],
            recommendation:
              'Review if this is a new subscription or duplicate of an existing one. Use "Already tracked" if it is.',
            actionLabel: 'Review Smart Inbox',
            actionUrl: '/app/smart-inbox',
            confidence: 75,
            source: 'smart_inbox',
          })
        )
        break
      }
    }
  }

  return insights
}
