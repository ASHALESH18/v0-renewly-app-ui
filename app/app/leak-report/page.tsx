'use client'

import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import { LeakReportScreen } from '@/components/screens/leak-report'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { LeakReportSkeleton } from '@/components/skeletons'

export default function LeakReportPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)

  if (isHydratingUserData && !userProfile) {
    return <LeakReportSkeleton />
  }

  const plan = userProfile?.plan || 'free'
  const capabilities = getCapabilities(plan)

  if (!capabilities.canUseLeakReport) {
    return (
      <PremiumLockedState
        featureName="Leak Report"
        currentPlan={plan}
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
