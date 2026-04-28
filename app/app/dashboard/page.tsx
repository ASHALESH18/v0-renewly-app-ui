'use client'

import { useState } from 'react'
import { DashboardScreen } from '@/components/screens/dashboard'
import { EditSubscriptionModal } from '@/components/screens/edit-subscription'
import { useRouter } from 'next/navigation'
import type { Subscription } from '@/lib/types'
import { isRenewlyManagedSubscription } from '@/lib/billing/managed-subscription-utils'
import useStore from '@/lib/store'

export default function DashboardPage() {
  const router = useRouter()
  const addToast = useStore((state) => state.addToast)
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const handleSubscriptionSelect = (subscription: Subscription) => {
    // Protect Renewly-managed subscriptions from edit flow
    if (isRenewlyManagedSubscription(subscription)) {
      addToast({
        type: 'info',
        title: 'Managed by Renewly',
        message: 'Renewly billing subscriptions are managed automatically.',
      })
      return
    }

    // Normal subscriptions open edit modal
    setEditingSubscription(subscription)
    setEditModalOpen(true)
  }

  return (
    <>
      <DashboardScreen
        onSubscriptionSelect={handleSubscriptionSelect}
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
