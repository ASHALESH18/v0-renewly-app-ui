'use client'

import { DashboardScreen } from '@/components/screens/dashboard'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <DashboardScreen
      onSubscriptionSelect={() => {}}
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
      onNotificationClick={() => router.push('/app/notifications')}
    />
  )
}
