'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'

/**
 * SubscriptionsInner - Component that uses hooks
 * Separated to properly handle hook rules
 */
function SubscriptionsInner({ children }: { children: React.ReactNode }) {
  // Hooks must be called at top level of component
  const { error, isAuthError } = useSubscriptions()

  // Log non-auth errors but don't crash
  if (error && !isAuthError) {
    console.warn('[v0] Subscriptions hook error:', error)
  }

  return <>{children}</>
}

/**
 * Provider component that syncs subscriptions from API to store
 * Place this high in the component tree to ensure data is loaded.
 * This provider gracefully handles auth errors during app initialization.
 */
export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  return <SubscriptionsInner>{children}</SubscriptionsInner>
}
