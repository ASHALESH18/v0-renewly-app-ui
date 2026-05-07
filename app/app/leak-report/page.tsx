'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import type { EffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import { LeakReportScreen } from '@/components/screens/leak-report'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { LeakReportSkeleton } from '@/components/skeletons'

export default function LeakReportPage() {
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
        console.error('[leak-report] Error fetching entitlement:', error)
      } finally {
        setIsLoadingEntitlement(false)
      }
    }

    fetchEntitlement()
  }, [])

  if (isHydratingUserData && !userProfile) {
    return <LeakReportSkeleton />
  }

  if (isLoadingEntitlement) {
    return <LeakReportSkeleton />
  }

  const effectivePlan = entitlement?.effectivePlan || 'free'
  const capabilities = getCapabilities(effectivePlan)

  if (!capabilities.canUseLeakReport) {
    return (
      <PremiumLockedState
        featureName="Leak Report"
        currentPlan={effectivePlan}
        description="Upgrade to unlock leak detection, savings signals, and renewal risk analysis."
      />
    )
  }

  return (
    <LeakReportScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
