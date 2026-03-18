'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { BottomNav, SidebarNav } from '@/components/bottom-nav'
import { AddSubscriptionSheet } from '@/components/screens/add-subscription'
import { SubscriptionDetailSheet } from '@/components/screens/subscription-detail'
import useStore from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  const hydrateAuthenticatedUserData = useStore((state) => state.hydrateAuthenticatedUserData)
  const setCurrentUser = useStore((state) => state.setCurrentUser)

  // Extract section from pathname: /app/dashboard -> dashboard
  const pathSegments = pathname.split('/')
  const activeTab = (pathSegments[2] || 'dashboard') as string

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
      <SidebarNav activeTab={activeTab} />

      {/* Main content area */}
      <main className="lg:ml-[280px] pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} />

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
