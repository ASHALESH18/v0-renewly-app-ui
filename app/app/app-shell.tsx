'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav, SidebarNav } from '@/components/bottom-nav'
import { AddSubscriptionSheet } from '@/components/screens/add-subscription'
import { SubscriptionDetailSheet } from '@/components/screens/subscription-detail'
import { CinematicPageTransition } from '@/components/motion'
import useStore from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

// Lightweight loading skeleton - minimal animations for fast perceived load
function AppShellSkeleton() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      {/* Desktop sidebar skeleton - static, no animations */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col bg-card border-r border-border z-40">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/60" />
            <div className="space-y-2">
              <div className="w-20 h-4 rounded bg-muted/50" />
              <div className="w-32 h-3 rounded bg-muted/30" />
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl">
              <div className="w-5 h-5 rounded bg-muted/40" />
              <div className="w-20 h-4 rounded bg-muted/40" />
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="w-full h-12 rounded-xl bg-gold/15" />
        </div>
      </aside>

      {/* Main content skeleton - simple opacity pulse */}
      <main className="lg:ml-[280px] pb-24 lg:pb-0">
        <div className="p-4 lg:p-6 space-y-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-32 h-6 rounded bg-muted/50" />
              <div className="w-48 h-4 rounded bg-muted/30" />
            </div>
            <div className="w-10 h-10 rounded-full bg-muted/40" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border">
                <div className="w-full h-24 rounded-xl bg-muted/20" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav skeleton - static */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-card/95 border-t border-border mx-4 mb-4 rounded-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2">
                <div className="w-5 h-5 rounded bg-muted/40" />
                <div className="w-8 h-2 rounded bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const hydrateAuthenticatedUserData = useStore((state) => state.hydrateAuthenticatedUserData)
  const userProfile = useStore((state) => state.userProfile)
  const isHydratingUserData = useStore((state) => state.isHydratingUserData)
  const hasHydratedFromCloud = useStore((state) => state.hasHydratedFromCloud)
  const isAddSubscriptionSheetOpen = useStore((state) => state.isAddSubscriptionSheetOpen)
  const closeAddSubscriptionSheet = useStore((state) => state.closeAddSubscriptionSheet)

  // Extract section from pathname: /app/dashboard -> dashboard
  const pathSegments = pathname.split('/')
  const activeTab = (pathSegments[2] || 'dashboard') as string

  // Initialize user data on mount with proper error handling
  const initializeUserData = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[v0] Auth error:', error.message)
        // If there's an auth error, redirect to sign-in
        router.replace('/auth/sign-in?error=session_expired')
        return
      }

      if (user?.email) {
        // Wait for hydration to complete before marking initialized
        await hydrateAuthenticatedUserData(user.id, user.email)
      }

      setIsInitialized(true)
    } catch (error) {
      console.error('[v0] Failed to initialize user data:', error)
      setInitError('Failed to load your data. Please refresh the page.')
      setIsInitialized(true) // Still mark as initialized to show error state
    }
  }, [hydrateAuthenticatedUserData, router])

  useEffect(() => {
    initializeUserData()
  }, [initializeUserData])

  // Computed: Are we truly ready to render children?
  // We need BOTH auth initialized AND store hydration complete
  const isFullyReady = isInitialized && (!isHydratingUserData || hasHydratedFromCloud || Boolean(userProfile))

  // Listen for auth state changes (e.g., token refresh, sign out)
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/')
      } else if (event === 'TOKEN_REFRESHED' && session?.user?.email) {
        // Re-hydrate on token refresh to ensure fresh data
        hydrateAuthenticatedUserData(session.user.id, session.user.email)
      }
    })

    return () => subscription?.unsubscribe()
  }, [hydrateAuthenticatedUserData, router])

  // Show loading skeleton while initializing OR hydrating store data
  // This ensures children don't render with stale/empty data
  if (!isFullyReady) {
    return <AppShellSkeleton />
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen overflow-x-hidden bg-transparent flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="w-12 h-12 mx-auto rounded-xl bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-muted-foreground">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-gold text-obsidian font-medium hover:bg-gold/90 transition-colors"
          >
            Refresh page
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Desktop sidebar */}
      <SidebarNav activeTab={activeTab} />

      {/* Main content area - instant render, no blocking transitions */}
      <main className="pb-24 lg:pb-0 min-h-screen w-full overflow-x-hidden lg:ml-[var(--sidebar-width,280px)] lg:w-[calc(100%-var(--sidebar-width,280px))] lg:max-w-[calc(100vw-var(--sidebar-width,280px))]">
        <CinematicPageTransition key={pathname}>
          {children}
        </CinematicPageTransition>
      </main>

      {/* Mobile bottom navigation */}
      <BottomNav activeTab={activeTab} />

      {/* Add subscription sheet */}
      <AddSubscriptionSheet open={isAddSubscriptionSheetOpen} onClose={closeAddSubscriptionSheet} />

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
