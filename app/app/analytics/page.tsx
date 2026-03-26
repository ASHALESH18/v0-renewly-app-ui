'use client'

import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import { AnalyticsScreen } from '@/components/screens/analytics'
import { PremiumLockedState } from '@/components/premium-locked-state'

function AppSectionLoading() {
  return (
    <div className="min-h-[calc(100vh-6rem)] px-6 py-8 lg:px-8">
      <div className="h-10 w-48 rounded-2xl bg-white/5 animate-pulse" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-28 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-28 rounded-3xl bg-white/5 animate-pulse" />
        <div className="h-28 rounded-3xl bg-white/5 animate-pulse" />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
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