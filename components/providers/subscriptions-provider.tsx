'use client'

import { useEffect, useState } from 'react'
import useStore from '@/lib/store'
import { useSubscriptions } from '@/lib/hooks/use-subscriptions'

export function SubscriptionsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const setSubscriptions = useStore((state) => state.setSubscriptions)
  const [ready, setReady] = useState(false)

  // Start subscription sync
  useSubscriptions()

  // Clear stale browser-stored subscription data before rendering pages
  useEffect(() => {
    setSubscriptions([])
    setReady(true)
  }, [setSubscriptions])

  if (!ready) return null

  return <>{children}</>
}

export default SubscriptionsProvider