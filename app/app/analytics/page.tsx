'use client'

import { AnalyticsScreen } from '@/components/screens/analytics'
import { useRouter } from 'next/navigation'

export default function AnalyticsPage() {
  const router = useRouter()

  return (
    <AnalyticsScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
