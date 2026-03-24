'use client'

import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav, SidebarNav } from '@/components/bottom-nav'
import { AddSubscriptionSheet } from '@/components/screens/add-subscription'
import { SubscriptionDetailSheet } from '@/components/screens/subscription-detail'
import { CinematicPageTransition } from '@/components/motion'
import useStore from '@/lib/store'
import { createClient } from '@/lib/supabase/client'
import type { Subscription } from '@/lib/types'

// Premium loading skeleton for the app shell
function AppShellSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar skeleton */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-[280px] flex-col bg-card border-r border-border z-40">
        {/* Logo skeleton */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient animate-pulse" />
            <div className="space-y-2">
              <div className="w-20 h-4 rounded bg-muted animate-pulse" />
              <div className="w-32 h-3 rounded bg-muted/50 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Nav items skeleton */}
        <nav className="flex-1 p-4 space-y-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-5 h-5 rounded bg-muted animate-pulse" />
              <div className="w-24 h-4 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </nav>

        {/* Add button skeleton */}
        <div className="p-4 border-t border-border">
          <div className="w-full h-12 rounded-xl bg-gold/20 animate-pulse" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="lg:ml-[280px] pb-24 lg:pb-0">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-32 h-6 rounded bg-muted animate-pulse" />
              <div className="w-48 h-4 rounded bg-muted/50 animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
            </div>
          </div>

          {/* Content skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl glass animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-full h-24 rounded-xl bg-muted/30" />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Mobile bottom nav skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="glass-strong mx-4 mb-4 rounded-2xl">
          <div className="flex items-center justify-around px-2 py-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1 px-3 py-2">
                <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                <div className="w-8 h-2 rounded bg-muted/50 animate-pulse" />
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
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [showDetailSheet, setShowDetailSheet] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  const hydrateAuthenticatedUserData = useStore((state) => state.hydrateAuthenticatedUserData)
  const userProfile = useStore((state) => state.userProfile)

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

  // Listen for auth state changes (e.g., token refresh, sign out)
  useEffect(() => {
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/auth/sign-in')
      } else if (event === 'TOKEN_REFRESHED' && session?.user?.email) {
        // Re-hydrate on token refresh to ensure fresh data
        hydrateAuthenticatedUserData(session.user.id, session.user.email)
      }
    })

    return () => subscription?.unsubscribe()
  }, [hydrateAuthenticatedUserData, router])

  // Show loading skeleton while initializing
  if (!isInitialized) {
    return <AppShellSkeleton />
  }

  // Show error state if initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <SidebarNav activeTab={activeTab} />

      {/* Main content area with page transitions - sidebar sets --sidebar-width CSS var */}
      <main className="lg:ml-[var(--sidebar-width,280px)] lg:transition-[margin-left] lg:duration-200 pb-24 lg:pb-0 min-h-screen">
        <AnimatePresence mode="wait">
          <CinematicPageTransition key={pathname}>
            {children}
          </CinematicPageTransition>
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
