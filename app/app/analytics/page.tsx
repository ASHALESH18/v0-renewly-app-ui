'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import type { EffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import { AnalyticsScreen } from '@/components/screens/analytics'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { AnalyticsSkeleton } from '@/components/skeletons'

export default function AnalyticsPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)
  const [entitlement, setEntitlement] = useState<EffectiveEntitlement | null>(null)
  const [isLoadingEntitlement, setIsLoadingEntitlement] = useState(true)

  useEffect(() => {
    const fetchEntitlement = async () => {
      try {
        const res = await fetch('/api/entitlements/current')
        if (res.ok) {
          const data = await res.json()
          setEntitlement(data)
        }
      } catch (error) {
        console.error('[analytics] Error fetching entitlement:', error)
      } finally {
        setIsLoadingEntitlement(false)
      }
    }

    fetchEntitlement()
  }, [])

  if (isHydratingUserData && !userProfile) {
    return <AnalyticsSkeleton />
  }

  if (isLoadingEntitlement) {
    return <AnalyticsSkeleton />
  }

  const effectivePlan = entitlement?.effectivePlan || 'free'
  const capabilities = getCapabilities(effectivePlan)

  if (!capabilities.canUseLeakReport) {
    return (
      <PremiumLockedState
        featureName="Analytics"
        currentPlan={effectivePlan}
        description="Upgrade to unlock deeper spending insights, category breakdowns, and trend analysis."
      />
    )
  }

  return (
    <AnalyticsScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
