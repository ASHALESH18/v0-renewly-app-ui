/**
 * Billing lifecycle helpers for managing period-end billing behavior
 * Handles pending cancellations/downgrades scheduled for renewal dates
 */

import type { Subscription } from '@/lib/types'
import { isRenewlyManagedSubscription } from './managed-subscription-utils'

export interface PendingBillingChange {
  type: 'cancel' | 'downgrade'
  target_plan: 'free' | 'pro'
  effective_at: string // ISO date string
  requested_at: string // ISO datetime string
  source: 'qa_preview' | string
}

/**
 * Extract Renewly-managed plan from subscription
 */
export function getRenewlyManagedPlan(subscription: any): 'pro' | 'family' | null {
  if (!isRenewlyManagedSubscription(subscription)) return null

  const managedPlan = subscription.managedPlan || subscription.managed_plan
  if (managedPlan === 'pro' || managedPlan === 'family') {
    return managedPlan
  }

  // Fallback to name parsing
  const name = String(subscription.name || '').toLowerCase().trim()
  if (name.includes('family')) return 'family'
  if (name.includes('pro')) return 'pro'

  return null
}

/**
 * Get subscription renewal date
 */
export function getSubscriptionRenewalDate(subscription: any): string | null {
  if (!subscription) return null
  return subscription.renewalDate || subscription.renewal_date || null
}

/**
 * Extract pending billing change from systemMetadata
 */
export function getPendingBillingChange(subscription: any): PendingBillingChange | null {
  if (!subscription) return null

  const metadata = subscription.systemMetadata || subscription.system_metadata
  if (!metadata) return null

  const pending = metadata.pending_billing_change
  if (!pending || typeof pending !== 'object') return null

  return pending as PendingBillingChange
}

/**
 * Check if subscription has a pending billing change
 */
export function hasPendingBillingChange(subscription: any): boolean {
  return getPendingBillingChange(subscription) !== null
}

/**
 * Get badge text for pending billing change
 */
export function getPendingBillingBadgeText(subscription: any): string | null {
  const pending = getPendingBillingChange(subscription)
  if (!pending) return null

  const effectiveDate = new Date(pending.effective_at)
  const dateStr = effectiveDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (pending.type === 'cancel') {
    return `Cancels on ${dateStr}`
  } else if (pending.type === 'downgrade') {
    return `Downgrades to ${pending.target_plan === 'pro' ? 'Pro' : 'Free'} on ${dateStr}`
  }

  return null
}

/**
 * Get detailed message for pending billing change
 */
export function getPendingBillingMessage(subscription: any): string | null {
  const pending = getPendingBillingChange(subscription)
  if (!pending) return null

  const effectiveDate = new Date(pending.effective_at)
  const dateStr = effectiveDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: effectiveDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })

  if (pending.type === 'cancel') {
    return `Your subscription will be cancelled on ${dateStr}`
  } else if (pending.type === 'downgrade') {
    const targetName = pending.target_plan === 'pro' ? 'Pro' : 'Free'
    return `Your subscription will downgrade to ${targetName} on ${dateStr}`
  }

  return null
}

/**
 * Determine if a managed Renewly subscription should be displayed
 * Handles deduplication when both Pro and Family might be active
 */
export function shouldDisplayManagedRenewlySubscription(
  subscription: any,
  userPlan: string | undefined,
  allSubscriptions: any[]
): boolean {
  if (!isRenewlyManagedSubscription(subscription)) return true

  const managedPlan = getRenewlyManagedPlan(subscription)
  if (!managedPlan) return true

  const pending = getPendingBillingChange(subscription)
  const isCoveredFamilySubscription = Boolean(subscription.coveredByFamily || subscription.covered_by_family)

  // If stale owner-style and covered-member rows both exist for the same user,
  // prefer the covered member row so Family members never see owner pricing.
  const hasCoveredFamilyRow = allSubscriptions.some(
    (s) =>
      isRenewlyManagedSubscription(s) &&
      (s.status === 'active' || s.status === 'unused') &&
      getRenewlyManagedPlan(s) === 'family' &&
      Boolean(s.coveredByFamily || s.covered_by_family)
  )

  if (managedPlan === 'family' && hasCoveredFamilyRow) {
    return isCoveredFamilySubscription
  }

  // If this subscription has a pending change with future effective date, show it
  if (pending && pending.effective_at) {
    const effectiveDate = new Date(pending.effective_at)
    if (effectiveDate > new Date()) {
      return true
    }
  }

  // Find other active Renewly managed subscriptions
  const activeRenewlyManaged = allSubscriptions.filter(
    (s) =>
      isRenewlyManagedSubscription(s) &&
      (s.status === 'active' || s.status === 'unused') &&
      getRenewlyManagedPlan(s) !== null &&
      s.id !== subscription.id
  )

  if (activeRenewlyManaged.length === 0) {
    // No conflict
    return true
  }

  // Multiple active Renewly managed subscriptions exist
  // Prefer the one matching userPlan
  if (userPlan && managedPlan === userPlan) {
    return true
  }

  // Prefer Family over Pro if both exist and Family is the user plan
  const hasFamily = activeRenewlyManaged.some((s) => getRenewlyManagedPlan(s) === 'family')
  if (hasFamily && userPlan === 'family' && managedPlan === 'family') {
    return true
  }

  // Prefer the newest by renewal date (if available)
  const thisRenewalDate = getSubscriptionRenewalDate(subscription)
  const otherDates = activeRenewlyManaged
    .map((s) => ({ sub: s, date: getSubscriptionRenewalDate(s) }))
    .filter((x) => x.date)

  if (thisRenewalDate && otherDates.length > 0) {
    const newestOther = otherDates.reduce((newest, current) =>
      new Date(current.date!) > new Date(newest.date!) ? current : newest
    )
    if (thisRenewalDate > newestOther.date) {
      return true
    }
    // Hide this one if another is newer
    return false
  }

  // Default: hide to avoid showing both Pro and Family
  return false
}

/**
 * Filter subscriptions to avoid duplicate active Renewly managed cards
 */
export function filterDisplayableSubscriptionsForCurrentPlan(
  subscriptions: any[],
  userPlan: string | undefined
): any[] {
  return subscriptions.filter((sub) => shouldDisplayManagedRenewlySubscription(sub, userPlan, subscriptions))
}
