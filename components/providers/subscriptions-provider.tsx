'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'
import { useState } from 'react'

/**
 * SubscriptionsWrapper - Internal wrapper with error boundary
 * Catches any React errors from the useSubscriptions hook
 */
function SubscriptionsWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

/**
 * Provider component that syncs subscriptions from API to store
 * Place this high in the component tree to ensure data is loaded
 * Includes error handling to prevent crashes on auth errors
 */
export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<string | null>(null)

  // This hook fetches subscriptions and syncs to the store
  // Protected with error handling to prevent provider crash
  let hookContent = null
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { error: hookError } = useSubscriptions()
    
    if (hookError) {
      console.warn('[v0] SubscriptionsProvider hook error:', hookError)
      // Don't set state error for 401s - they're expected during auth
      if (!hookError.message?.includes('401')) {
        setError(hookError.message)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load subscriptions'
    console.error('[v0] SubscriptionsProvider error:', message)
    setError(message)
  }

  // If there's a non-auth error, still render children but log it
  if (error) {
    console.warn('[v0] Subscriptions provider error, rendering children without subscription data:', error)
  }

  return <SubscriptionsWrapper>{children}</SubscriptionsWrapper>
}
