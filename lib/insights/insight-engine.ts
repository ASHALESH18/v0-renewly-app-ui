/**
 * AI Insight Engine Lite - Core Engine
 *
 * Generates rule-based, evidence-backed insights from app data.
 * No external AI/LLM calls. Pure deterministic logic.
 */

import type { Insight, InsightGenerationContext, InsightSeverity } from './insight-types'
import { generateFamilyInsights } from './family-insights'
import { generateSubscriptionInsights } from './subscription-insights'
import { generateSmartInboxInsights } from './smart-inbox-insights'
import { generateIntegrationInsights } from './integration-insights'
import { generateSecurityInsights } from './security-insights'

/**
 * Generate all insights for a user based on their current state
 */
export async function generateAllInsights(context: InsightGenerationContext): Promise<Insight[]> {
  const insights: Insight[] = []
  const seenIds = new Set<string>()

  try {
    // Generate insights from each domain
    const familyInsights = generateFamilyInsights(context)
    const subscriptionInsights = generateSubscriptionInsights(context)
    const inboxInsights = generateSmartInboxInsights(context)
    const integrationInsights = generateIntegrationInsights(context)
    const securityInsights = generateSecurityInsights(context)

    // Combine all insights
    const allInsights = [
      ...familyInsights,
      ...subscriptionInsights,
      ...inboxInsights,
      ...integrationInsights,
      ...securityInsights,
    ]

    // Deduplicate by ID and add metadata
    for (const insight of allInsights) {
      if (!seenIds.has(insight.id)) {
        insights.push({
          ...insight,
          generatedAt: new Date().toISOString(),
        })
        seenIds.add(insight.id)
      }
    }

    // Sort by severity (critical > warning > info > success) and confidence
    insights.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2, success: 3 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff

      const confidenceA = a.confidence ?? 50
      const confidenceB = b.confidence ?? 50
      return confidenceB - confidenceA
    })

    return insights
  } catch (error) {
    console.error('[Insights] Error generating insights:', error)
    // Return empty array instead of crashing
    return []
  }
}

/**
 * Generate top N insights by priority
 */
export function getTopInsights(insights: Insight[], count: number = 5): Insight[] {
  return insights.slice(0, count)
}

/**
 * Filter insights by category
 */
export function getInsightsByCategory(
  insights: Insight[],
  category: string
): Insight[] {
  return insights.filter((i) => i.category === category)
}

/**
 * Get insights by severity
 */
export function getInsightsBySeverity(
  insights: Insight[],
  severity: InsightSeverity
): Insight[] {
  return insights.filter((i) => i.severity === severity)
}

/**
 * Helper to create an insight
 */
export function createInsight(overrides: Partial<Insight>): Insight {
  return {
    id: overrides.id || `insight_${Date.now()}`,
    type: overrides.type || 'generic',
    category: overrides.category || 'system',
    severity: overrides.severity || 'info',
    title: overrides.title || 'New Insight',
    summary: overrides.summary || '',
    evidence: overrides.evidence || [],
    recommendation: overrides.recommendation || '',
    ...overrides,
  }
}
