'use client'

import { LeakReportScreen } from '@/components/screens/leak-report'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'

export default function LeakReportPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const plan = userProfile?.plan || 'free'
  const capabilities = getCapabilities(plan)

  // Gate leak report for free users
  if (!capabilities.canUseLeakReport) {
    return (
      <div className="min-h-screen bg-obsidian">
        <PremiumLockedState
          featureName="Leak Report"
          description="Identify unused subscriptions, potential savings, and spending leaks with our intelligent analysis."
          requiredPlan="pro"
          currentPlan={plan}
        />
      </div>
    )
  }

  return (
    <LeakReportScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
