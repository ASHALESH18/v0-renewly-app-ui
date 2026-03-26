'use client'

import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import { LeakReportScreen } from '@/components/screens/leak-report'
import { PremiumLockedState } from '@/components/premium-locked-state'

function AppSectionLoading() {
  return (
    <div className="min-h-[calc(100vh-6rem)] px-6 py-8 lg:px-8">
      <div className="h-10 w-56 rounded-2xl bg-white/5 animate-pulse" />
      <div className="mt-6 h-56 rounded-3xl bg-white/5 animate-pulse" />
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-40 rounded-3xl bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

export default function LeakReportPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)

  if (isHydratingUserData && !userProfile) {
    return <AppSectionLoading />
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