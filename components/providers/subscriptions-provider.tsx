'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'

/**
 * Provider component that syncs subscriptions from API to store
 * Place this high in the component tree to ensure data is loaded
 */
export function SubscriptionsProvider({ children }: { children: React.ReactNode }) {
  // This hook fetches subscriptions and syncs to the store
  useSubscriptions()
  
  return <>{children}</>
}
