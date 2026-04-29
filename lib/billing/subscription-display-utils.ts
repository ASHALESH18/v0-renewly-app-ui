import type { Subscription } from '@/lib/types'
import { isRenewlyManagedSubscription } from './managed-subscription-utils'

/**
 * Filter to determine if a subscription should be displayed in dashboard/tracker
 * Hides archived/cancelled system-managed Renewly subscriptions from normal display
 * 
 * Rules:
 * - Hide if subscription is Renewly-managed AND status is "cancelled" or "archived"
 * - Do not hide normal active user-created subscriptions
 * - Do not hide active Renewly Pro/Family managed subscriptions
 * - Do not remove rows from database; only filter from display
 */
export function isDisplayableSubscription(subscription: Subscription | null): boolean {
  if (!subscription) return false

  const isManaged = isRenewlyManagedSubscription(subscription)
  
  // Use string-safe status checking to avoid type comparison issues
  const status = String((subscription as any).status || '').toLowerCase()
  const isCancelledOrArchived =
    status === 'cancelled' || status === 'archived'

  // Hide archived/cancelled managed subscriptions
  if (isManaged && isCancelledOrArchived) {
    return false
  }

  // Show everything else
  return true
}
