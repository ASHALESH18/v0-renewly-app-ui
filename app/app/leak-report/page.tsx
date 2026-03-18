'use client'

import { LeakReportScreen } from '@/components/screens/leak-report'
import { useRouter } from 'next/navigation'

export default function LeakReportPage() {
  const router = useRouter()

  return (
    <LeakReportScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
