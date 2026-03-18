'use client'

import { CalendarScreen } from '@/components/screens/calendar'
import { useRouter } from 'next/navigation'

export default function CalendarPage() {
  const router = useRouter()

  return (
    <CalendarScreen
      onNavigateTab={(tab) => router.push(`/app/${tab}`)}
      onProfileClick={() => router.push('/app/settings')}
    />
  )
}
