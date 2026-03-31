'use client'

import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import { AnalyticsScreen } from '@/components/screens/analytics'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { AnalyticsSkeleton } from '@/components/skeletons'

export default function AnalyticsPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)

  if (isHydratingUserData && !userProfile) {
    return <AnalyticsSkeleton />
  }

  const plan = userProfile?.plan || 'free'
  const capabilities = getCapabilities(plan)

  if (!capabilities.canUseLeakReport) {
    return (
      <PremiumLockedState
        featureName="Analytics"
        currentPlan={plan}
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
