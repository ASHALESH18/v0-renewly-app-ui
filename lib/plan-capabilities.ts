// Plan-based feature entitlements and limitations
// This is the source of truth for what each plan can do

export type PlanType = 'free' | 'pro' | 'family' | 'enterprise'

export interface PlanCapabilities {
  maxSubscriptions: number // -1 = unlimited
  canUseLeakReport: boolean
  canExportData: boolean
  canSetReminders: boolean
  canUseMultiCurrency: boolean
  canShareFamily: boolean
  canUseSSOEnterprise: boolean
  prioritySupport: boolean
}

export const planCapabilities: Record<PlanType, PlanCapabilities> = {
  free: {
    maxSubscriptions: 2, // Hard limit: 2 subscriptions
    canUseLeakReport: false,
    canExportData: false,
    canSetReminders: true,
    canUseMultiCurrency: false,
    canShareFamily: false,
    canUseSSOEnterprise: false,
    prioritySupport: false,
  },
  pro: {
    maxSubscriptions: -1, // Unlimited
    canUseLeakReport: true,
    canExportData: true,
    canSetReminders: true,
    canUseMultiCurrency: true,
    canShareFamily: false,
    canUseSSOEnterprise: false,
    prioritySupport: true,
  },
  family: {
    maxSubscriptions: -1, // Unlimited
    canUseLeakReport: true,
    canExportData: true,
    canSetReminders: true,
    canUseMultiCurrency: true,
    canShareFamily: true,
    canUseSSOEnterprise: false,
    prioritySupport: true,
  },
  enterprise: {
    maxSubscriptions: -1, // Unlimited
    canUseLeakReport: true,
    canExportData: true,
    canSetReminders: true,
    canUseMultiCurrency: true,
    canShareFamily: true,
    canUseSSOEnterprise: true,
    prioritySupport: true,
  },
}

/**
 * Get capabilities for a specific plan
 */
export function getCapabilities(plan: PlanType): PlanCapabilities {
  return planCapabilities[plan]
}

/**
 * Check if a user on a specific plan can perform an action
 */
export function canPerformAction(
  plan: PlanType,
  action: keyof PlanCapabilities
): boolean {
  const caps = getCapabilities(plan)
  const value = caps[action]

  // For boolean capabilities, return the value directly
  if (typeof value === 'boolean') {
    return value
  }

  // For numeric capabilities (like maxSubscriptions), return true
  // The actual limit checking is done separately
  return true
}

/**
 * Check if user has hit their subscription limit
 */
export function hasHitSubscriptionLimit(
  plan: PlanType,
  currentSubscriptionCount: number
): boolean {
  const caps = getCapabilities(plan)

  // Unlimited subscriptions
  if (caps.maxSubscriptions === -1) {
    return false
  }

  return currentSubscriptionCount >= caps.maxSubscriptions
}

/**
 * Get human-readable limit message
 */
export function getSubscriptionLimitMessage(plan: PlanType): string {
  const caps = getCapabilities(plan)

  if (caps.maxSubscriptions === -1) {
    return 'Unlimited subscriptions'
  }

  return `Up to ${caps.maxSubscriptions} subscription${caps.maxSubscriptions > 1 ? 's' : ''}`
}
