/**
 * AI Insight Engine Lite - Type Definitions
 *
 * Rule-based insight generation using deterministic signals from app data.
 * Every insight follows: Signal → Evidence → Recommendation → Action
 *
 * No external AI/LLM calls. No autonomous mutations.
 */

export type InsightCategory =
  | 'family'
  | 'renewals'
  | 'spend'
  | 'security'
  | 'smart_inbox'
  | 'integrations'
  | 'billing'
  | 'system'

export type InsightSeverity = 'info' | 'success' | 'warning' | 'critical'

export interface Insight {
  /** Stable, deterministic ID for deduplication */
  id: string

  /** Insight type/scenario identifier */
  type: string

  /** Functional category for grouping */
  category: InsightCategory

  /** Severity level for prioritization */
  severity: InsightSeverity

  /** Short, actionable title */
  title: string

  /** Longer description of the situation */
  summary: string

  /** Evidence backing the insight (user-facing) */
  evidence: string[]

  /** Recommendation for user action */
  recommendation: string

  /** Optional call-to-action button label */
  actionLabel?: string

  /** Optional URL to navigate to */
  actionUrl?: string

  /** Confidence/relevance 0-100 */
  confidence?: number

  /** Source of insight generation */
  source?: string

  /** Arbitrary metadata for tracking/debugging */
  metadata?: Record<string, unknown>

  /** When insight was generated */
  generatedAt?: string

  /** Whether this insight should be dismissed once per session */
  dismissible?: boolean
}

/**
 * Insight generation context - data available for insight generation
 */
export interface InsightGenerationContext {
  // Family data
  familyStatus?: {
    isOwner?: boolean
    isPendingMember?: boolean
    isCoveredMember?: boolean
    seatUsage?: {
      activeIncludedMembers?: number
      pendingIncludedInvites?: number
      activeExtraMembers?: number
      pendingExtraInvites?: number
      includedSeatsUsed?: number
      includedLimit?: number
      availableExtraSeats?: number
      paidActiveExtraSeats?: number
    }
    seatAddons?: Array<{
      id?: string
      quantity?: number
      status?: string
      cancelAtPeriodEnd?: boolean
      currentPeriodEnd?: string
    }>
    members?: Array<{
      id?: string
      status?: string
    }>
  }

  // Subscription data
  subscriptions?: Array<{
    id: string
    name: string
    amount: number
    status?: string
    renewalDate?: string
    category?: string
    billingCycle?: string
  }>

  // Smart Inbox data
  candidates?: Array<{
    id: string
    name: string
    confidence?: number
    metadata?: Record<string, unknown>
  }>

  // Integration data
  integrations?: Array<{
    id: string
    name: string
    status?: string
    connected?: boolean
  }>

  // Analytics data
  analytics?: {
    avgMonthlySpend?: number
    projectedYearlySpend?: number
    unusedCount?: number
    renewalCount?: number
    categories?: Array<{ name: string; percentage: number }>
  }

  // User preferences
  preferences?: {
    currency?: string
    language?: string
  }
}
