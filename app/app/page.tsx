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
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const hydrateAuthenticatedUserData = useStore((state) => state.hydrateAuthenticatedUserData)
  const setCurrentUser = useStore((state) => state.setCurrentUser)

  // Hydrate authenticated user data on mount
  useEffect(() => {
    async function initializeUserData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user?.email) {
          setCurrentUser(user.id, user.email)
          await hydrateAuthenticatedUserData(user.id, user.email)
        }
      } catch (error) {
        console.error('[v0] Failed to initialize user data:', error)
      } finally {
        setIsLoadingAuth(false)
      }
    }

    initializeUserData()
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

  // Helper to navigate to a specific tab
  const navigateToTab = (tab: string) => {
    setActiveTab(tab)
  }

  // Show loading state while auth is being checked
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-8 h-8 rounded-lg gold-gradient animate-pulse" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <SidebarNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Main content area */}
      <main className="lg:ml-[280px] pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <DashboardScreen 
              key="dashboard" 
              onSubscriptionSelect={handleSelectSubscription}
              onNavigateTab={navigateToTab}
              onProfileClick={() => navigateToTab('settings')}
              onNotificationClick={() => navigateToTab('notifications')}
            />
          )}
          {activeTab === 'calendar' && (
            <CalendarScreen 
              key="calendar"
              onNavigateTab={navigateToTab}
              onProfileClick={() => navigateToTab('settings')}
            />
          )}
          {activeTab === 'analytics' && (
            <AnalyticsScreen 
              key="analytics"
              onNavigateTab={navigateToTab}
              onProfileClick={() => navigateToTab('settings')}
            />
          )}
          {activeTab === 'leak-report' && (
            <LeakReportScreen 
              key="leak-report"
              onNavigateTab={navigateToTab}
              onProfileClick={() => navigateToTab('settings')}
            />
          )}
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
