'use client'

import { AnalyticsScreen } from '@/components/screens/analytics'
import { PremiumLockedState } from '@/components/premium-locked-state'
import { useRouter } from 'next/navigation'
import useStore from '@/lib/store'
import { getCapabilities } from '@/lib/plan-capabilities'
import { useState, useEffect } from 'react'

export default function AnalyticsPage() {
  const router = useRouter()
  const userProfile = useStore((state) => state.userProfile)
  const hasHydratedFromCloud = useStore((state) => state.hasHydratedFromCloud)
  const [isReady, setIsReady] = useState(false)
  
  // Wait for hydration before checking plan
  useEffect(() => {
    if (hasHydratedFromCloud) {
      setIsReady(true)
    }
  }, [hasHydratedFromCloud])

  // Show loading while hydrating
  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-gold/20 border-2 border-gold/30 border-t-gold animate-spin" />
      </div>
    )
  }

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
