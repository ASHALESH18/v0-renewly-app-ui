'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BottomNav, SidebarNav } from '@/components/bottom-nav'
import { DashboardScreen } from '@/components/screens/dashboard'
import { CalendarScreen } from '@/components/screens/calendar'
import { AnalyticsScreen } from '@/components/screens/analytics'
import { LeakReportScreen } from '@/components/screens/leak-report'
import { NotificationsScreen } from '@/components/screens/notifications'
import { SettingsScreen } from '@/components/screens/settings'
import { AddSubscriptionSheet } from '@/components/screens/add-subscription'
import { SubscriptionDetailSheet } from '@/components/screens/subscription-detail'
import useStore from '@/lib/store'
import type { Subscription } from '@/lib/types'

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const initializeWithDefaults = useStore((state) => state.initializeWithDefaults)

  // Initialize store with default data on first load
  useEffect(() => {
    initializeWithDefaults()
  }, [])

  const handleTabChange = (tab: string) => {
    if (tab === 'add') {
      setShowAddSheet(true)
    } else {
      setActiveTab(tab)
    }
  }

  const handleSelectSubscription = (subscription: Subscription) => {
    setSelectedSubscription(subscription)
    setShowDetailSheet(true)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content area */}
      <main className="lg:ml-[280px] pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardScreen key="dashboard" onSubscriptionSelect={handleSelectSubscription} />
          )}
          {activeTab === 'calendar' && <CalendarScreen key="calendar" />}
          {activeTab === 'analytics' && <AnalyticsScreen key="analytics" />}
          {activeTab === 'leak-report' && <LeakReportScreen key="leak-report" />}
          {activeTab === 'notifications' && <NotificationsScreen key="notifications" />}
          {activeTab === 'settings' && <SettingsScreen key="settings" />}
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Add subscription sheet */}
      <AddSubscriptionSheet open={showAddSheet} onClose={() => setShowAddSheet(false)} />

      {/* Subscription detail/edit sheet */}
      <SubscriptionDetailSheet
        subscription={selectedSubscription}
        open={showDetailSheet}
        onClose={() => {
          setShowDetailSheet(false)
          setSelectedSubscription(null)
        }}
      />
    </div>
  )
}
