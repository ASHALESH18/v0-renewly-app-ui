/**
 * Helper functions for Renewly-managed subscriptions (Pro/Family)
 * Used to protect UI from opening edit flows for system-managed subscriptions
 */

/**
 * Robust check for Renewly-managed subscriptions
 * Handles multiple field name variants (snake_case and camelCase)
 * and checks all indicators
 */
export function isRenewlyManagedSubscription(subscription: any): boolean {
  if (!subscription) return false

  // Check isSystemManaged flag
  if (subscription.isSystemManaged === true || subscription.is_system_managed === true) {
    return true
  }

  // Check systemSource field
  const systemSource = subscription.systemSource || subscription.system_source
  if (systemSource === 'renewly_billing') {
    return true
  }

  // Check managedPlan field
  const managedPlan = subscription.managedPlan || subscription.managed_plan
  if (managedPlan === 'pro' || managedPlan === 'family') {
    return true
  }

  // Check managedSubscriptionKey field
  const managedKey = String(
    subscription.managedSubscriptionKey ||
    subscription.managed_subscription_key ||
    ''
  ).toLowerCase()
  if (managedKey.startsWith('renewly:')) {
    return true
  }

  // Check subscription name (fallback)
  const name = String(subscription.name || '').toLowerCase().trim()
  if (name === 'renewly pro' || name === 'renewly family') {
    return true
  }

  return false
}
