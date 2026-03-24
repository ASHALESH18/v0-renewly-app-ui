'use client'

import { AnalyticsScreen } from '@/components/screens/analytics'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'

export default function AnalyticsPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const plan = userProfile?.plan || 'free'
  const capabilities = getCapabilities(plan)

  // Gate analytics for free users
  if (!capabilities.canUseLeakReport) {
    return (
      <div className="min-h-screen bg-obsidian">
        <PremiumLockedState
          featureName="Analytics"
          description="Get detailed insights into your subscription spending, trends, and optimization opportunities with Pro."
          requiredPlan="pro"
          currentPlan={plan}
        />
      </div>
    )
  }

  return (
    <AnalyticsScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
