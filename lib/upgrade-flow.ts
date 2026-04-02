/**
 * Centralized upgrade flow handling
 * Ensures consistent CTA behavior across homepage and pricing
 */

const UPGRADE_INTENT_KEY = 'renewly_upgrade_intent'

export interface UpgradeIntent {
  planId: 'pro' | 'family' | 'enterprise'
  timestamp: number
}

/**
 * Store upgrade intent in sessionStorage for post-auth continuation
 */
export function setUpgradeIntent(planId: 'pro' | 'family' | 'enterprise'): void {
  if (typeof window === 'undefined') return
  
  const intent: UpgradeIntent = {
    planId,
    timestamp: Date.now()
  }
  sessionStorage.setItem(UPGRADE_INTENT_KEY, JSON.stringify(intent))
}

/**
 * Get stored upgrade intent (if any and not expired - 30 min max)
 */
export function getUpgradeIntent(): UpgradeIntent | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = sessionStorage.getItem(UPGRADE_INTENT_KEY)
    if (!stored) return null
    
    const intent: UpgradeIntent = JSON.parse(stored)
    
    // Expire after 30 minutes
    const THIRTY_MINUTES = 30 * 60 * 1000
    if (Date.now() - intent.timestamp > THIRTY_MINUTES) {
      clearUpgradeIntent()
      return null
    }
    
    return intent
  } catch {
    return null
  }
}

/**
 * Clear stored upgrade intent
 */
export function clearUpgradeIntent(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(UPGRADE_INTENT_KEY)
}

/**
 * Get the destination URL for upgrade flow
 * - Authenticated users go to /app/upgrade?plan=X
 * - Unauthenticated users go to /auth/sign-in?next=/app/upgrade&plan=X
 */
export function getUpgradeDestination(
  planId: 'pro' | 'family' | 'enterprise',
  isAuthenticated: boolean
): string {
  const upgradeUrl = `/app/upgrade?plan=${planId}`
  
  if (isAuthenticated) {
    return upgradeUrl
  }
  
  // Store intent for post-auth continuation
  setUpgradeIntent(planId)
  return `/auth/sign-in?next=${encodeURIComponent(upgradeUrl)}`
}

/**
 * Get the destination URL for generic "get started" flow
 * - Authenticated users go to /app/dashboard
 * - Unauthenticated users go to /auth/sign-in?next=/app/dashboard
 */
export function getStartedDestination(isAuthenticated: boolean): string {
  if (isAuthenticated) {
    return '/app/dashboard'
  }
  return '/auth/sign-in?next=/app/dashboard'
}
