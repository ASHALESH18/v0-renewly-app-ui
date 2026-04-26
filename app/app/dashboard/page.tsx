'use client'

import { useState } from 'react'
import { DashboardScreen } from '@/components/screens/dashboard'
import { EditSubscriptionModal } from '@/components/screens/edit-subscription'
import { useRouter } from 'next/navigation'
import type { Subscription } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  return (
    <>
      <DashboardScreen
        onSubscriptionSelect={(subscription) => {
          setEditingSubscription(subscription)
          setEditModalOpen(true)
        }}
        onNavigateTab={(tab) => router.push(`/app/${tab}`)}
        onProfileClick={() => router.push('/app/settings')}
        onNotificationClick={() => router.push('/app/notifications')}
      />
      <EditSubscriptionModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        subscription={editingSubscription}
      />
    </>
  )
}
