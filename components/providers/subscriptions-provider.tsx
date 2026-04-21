'use client'

import { useSubscriptions } from '@/lib/hooks/use-subscriptions'

/**
 * SubscriptionsProvider
 * Fetches and syncs subscriptions to the Zustand store on app startup.
 * The useSubscriptions hook handles all the heavy lifting - fetching from API,
 * normalizing snake_case DB fields to camelCase, and syncing to store.
 */
export function SubscriptionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // Call the hook to trigger subscription loading and syncing
  // This will run on mount and whenever the dependency changes
  useSubscriptions()

  return <>{children}</>
}

export default SubscriptionsProvider


