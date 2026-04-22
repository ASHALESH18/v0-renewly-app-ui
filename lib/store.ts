'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subscription } from './types'
import { createSubscription, updateSubscription, deleteSubscription } from './supabase/subscriptions-actions'
import type { ProfileRow, UserSettingsRow } from './supabase/database.types'
import { mapSubscriptionRowToUI, mapUserSettingsRowToUI } from './supabase/mappers'
import { calculateMetrics } from './subscription-math'
import { mutate } from 'swr'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

export interface UserProfile {
  email: string
  name: string
  plan: 'free' | 'pro' | 'family' | 'enterprise'
  countryCode?: string
  locale?: string
  timeZone?: string
  avatarSeed?: string
  avatarUrl?: string // Persisted avatar URL from database
}

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  leakAlerts: boolean
  reminderDays: number
  currencyCode: string
  /**
   * Renewly theme identifier.
   * - `light` / `dark` — baseline themes (unchanged).
   * - `glass`          — premium Apple Glass-inspired variant.
   */
  theme: 'light' | 'dark' | 'glass'
  language: string
  biometricEnabled: boolean
  countryCode?: string
  locale?: string
}

export interface AppState {
  // Auth & User State
  currentUserId: string | null
  currentUserEmail: string | null
  userProfile: UserProfile | null

  // Cloud Data
  subscriptions: Subscription[]
  notificationSettings: NotificationSettings

  // UI State
  theme: 'light' | 'dark' | 'glass'
  toasts: Toast[]

  // Loading/Sync State
  isHydratingUserData: boolean
  isSyncingUserData: boolean
  hasHydratedFromCloud: boolean
  syncError: string | null
  hasMigratedLocalData: boolean

  // Actions - Auth
  setCurrentUser: (userId: string | null, email: string | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  resetUserScopedState: () => void
  clearUserData: () => void

  // Actions - Cloud Data
  hydrateAuthenticatedUserData: (userId: string, email: string) => Promise<void>
  migrateLocalDataToSupabaseOnce: (userId: string) => Promise<void>
  loadSubscriptionsFromSupabase: (subscriptions: Subscription[]) => void
  setSubscriptions: (subscriptions: Subscription[]) => void

  // Actions - Subscriptions (local only - for optimistic updates)
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void

  // Actions - Subscriptions (remote-backed - use these for real data)
  addSubscriptionRemote: (subscription: Omit<Subscription, 'id'>) => Promise<{ success: boolean; error?: string }>
  updateSubscriptionRemote: (id: string, subscription: Partial<Subscription>) => Promise<{ success: boolean; error?: string }>
  deleteSubscriptionRemote: (id: string) => Promise<{ success: boolean; error?: string }>

  // Actions - Settings
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void

  // Actions - UI
  setTheme: (theme: 'light' | 'dark' | 'glass') => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  // UI State - Add Subscription Sheet
  isAddSubscriptionSheetOpen: boolean
  openAddSubscriptionSheet: () => void
  closeAddSubscriptionSheet: () => void

  // Actions - Plan Management
  refreshPlanFromServer: () => Promise<void>
  updatePlanLocally: (plan: 'free' | 'pro' | 'family' | 'enterprise') => void

  // Derived Selectors
  getMetrics: () => ReturnType<typeof calculateMetrics>
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial State
      currentUserId: null,
      currentUserEmail: null,
      userProfile: null,
      subscriptions: [],
      notificationSettings: {
        pushNotifications: true,
        emailNotifications: true,
        leakAlerts: true,
        reminderDays: 3,
        currencyCode: 'INR',
        theme: 'dark',
        language: 'en',
        biometricEnabled: false,
      },
      theme: 'dark',
      toasts: [],
      isHydratingUserData: false,
      isSyncingUserData: false,
      hasHydratedFromCloud: false,
      syncError: null,
      hasMigratedLocalData: false,
      isAddSubscriptionSheetOpen: false,

      // Set current authenticated user
      setCurrentUser: (userId, email) => set({
        currentUserId: userId,
        currentUserEmail: email,
      }),

      // Set user profile from Supabase
      setUserProfile: (profile) => set({ userProfile: profile }),

      // Reset all user-scoped state when user changes or logs out
      resetUserScopedState: () => set({
        subscriptions: [],
        userProfile: null,
        isHydratingUserData: false,
        hasHydratedFromCloud: false,
        hasMigratedLocalData: false,
        syncError: null,
      }),

      // Clear all user data on sign out
      clearUserData: () => set({
        currentUserId: null,
        currentUserEmail: null,
        subscriptions: [],
        userProfile: null,
        isHydratingUserData: false,
        hasHydratedFromCloud: false,
        hasMigratedLocalData: false,
        syncError: null,
      }),

      // Main hydration function for authenticated users
      hydrateAuthenticatedUserData: async (userId, email) => {
        const state = get()

        // Prevent concurrent hydration calls - if already hydrating, skip
        if (state.isHydratingUserData) {
          return
        }

        // Prevent cross-user data leakage: if user ID changed, reset state
        if (state.currentUserId && state.currentUserId !== userId) {
          set({ isHydratingUserData: true, syncError: null })
          get().resetUserScopedState()
        }

        if (state.hasHydratedFromCloud && state.currentUserId === userId) {
          return // Already hydrated for this user
        }

        set({ isHydratingUserData: true, syncError: null, currentUserId: userId, currentUserEmail: email })

        try {
          // Fetch user data from Supabase
          const response = await fetch('/api/hydrate-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email }),
          })

          // If endpoint doesn't exist or fails, continue with existing state
          if (!response.ok) {
            console.warn('[v0] Hydration endpoint not available, using default state')
            set({ hasHydratedFromCloud: true })
            return
          }

          const { profile, settings, subscriptions, shouldMigrate } = await response.json()

          // Set settings first to get timezone
          let savedTimeZone: string | undefined
          if (settings) {
            const uiSettings = mapUserSettingsRowToUI(settings)
            savedTimeZone = uiSettings.timeZone
            set({
              notificationSettings: uiSettings,
              theme: uiSettings.theme || get().theme,
            })
          }

          // Set profile with all persisted fields including timezone
          if (profile) {
            // Build full name from first/last or use full_name
            const fullName =
              [profile.first_name, profile.last_name]
                .filter(Boolean)
                .join(' ')
                .trim() || profile.full_name || email.split('@')[0]

            set({
              userProfile: {
                name: fullName,
                email: profile.email,
                plan: profile.plan,
                avatarUrl: profile.avatar_url || undefined,
                // Use timezone from settings (single source of truth)
                timeZone: savedTimeZone || profile.time_zone || undefined,
              },
            })
          }

          // Set subscriptions
          const uiSubscriptions = subscriptions.map(mapSubscriptionRowToUI)
          set({ subscriptions: uiSubscriptions })

          // Mark as hydrated
          set({ hasHydratedFromCloud: true })

          // Trigger one-time migration if needed
          if (shouldMigrate) {
            await get().migrateLocalDataToSupabaseOnce(userId)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Hydration failed'
          console.warn('[v0] Hydration error (non-critical):', message)
          // Don't set sync error - hydration is optional during initial load
          set({ hasHydratedFromCloud: true })
        } finally {
          set({ isHydratingUserData: false })
        }
      },

      // One-time migration of local data to Supabase
      migrateLocalDataToSupabaseOnce: async (userId) => {
        const state = get()
        if (state.hasMigratedLocalData) return

        try {
          const response = await fetch('/api/migrate-local-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })

          if (response.ok) {
            set({ hasMigratedLocalData: true })
            // Re-hydrate to get migrated data
            await get().hydrateAuthenticatedUserData(userId, state.currentUserEmail || '')
          }
        } catch (error) {
          console.error('[v0] Migration error:', error)
        }
      },

      // Load subscriptions from Supabase
      loadSubscriptionsFromSupabase: (subscriptions) => set({ subscriptions }),

      // Set subscriptions directly (used by useSubscriptions hook to sync API data)
      setSubscriptions: (subscriptions) => set({ subscriptions }),

      // Local subscription actions (these will be synced to Supabase via API)
      addSubscription: (subscription) => set((state) => ({
        subscriptions: [
          ...state.subscriptions,
          {
            ...subscription,
            id: Date.now().toString(),
          },
        ],
      })),

      updateSubscription: (id, updates) => set((state) => ({
        subscriptions: state.subscriptions.map(sub =>
          sub.id === id ? { ...sub, ...updates } : sub
        ),
      })),

      deleteSubscription: (id) => set((state) => ({
        subscriptions: state.subscriptions.filter(sub => sub.id !== id),
      })),

      // Remote-backed subscription actions
      addSubscriptionRemote: async (subscription) => {
        set({ isSyncingUserData: true, syncError: null })

        try {
          const result = await createSubscription({
            name: subscription.name,
            category: subscription.category,
            amount: subscription.amount,
            currency: subscription.currency || 'INR',
            billingCycle: subscription.billingCycle,
            renewalDate: subscription.renewalDate,
            description: subscription.description,
            status: subscription.status ?? 'active',
          })

          if (result.success) {
            // Fetch fresh subscriptions from API and replace store
            await mutate('/api/subscriptions')
            set({ syncError: null })
            return { success: true }
          }

          const error = result.error || 'Failed to add subscription'
          set({ syncError: error })
          return { success: false, error }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to add subscription'
          set({ syncError: message })
          return { success: false, error: message }
        } finally {
          set({ isSyncingUserData: false })
        }
      },

      updateSubscriptionRemote: async (id, updates) => {
        set({ isSyncingUserData: true, syncError: null })

        try {
          const result = await updateSubscription(id, {
            name: updates.name,
            amount: updates.amount,
            billingCycle: updates.billingCycle,
            renewalDate: updates.renewalDate,
            description: updates.description,
            status: updates.status,
            currency: updates.currency,
            category: updates.category,
          })

          if (result.success) {
            // Fetch fresh subscriptions from API and replace store
            await mutate('/api/subscriptions')
            set({ syncError: null })
            return { success: true }
          }

          const error = result.error || 'Failed to update subscription'
          set({ syncError: error })
          return { success: false, error }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update subscription'
          set({ syncError: message })
          return { success: false, error: message }
        } finally {
          set({ isSyncingUserData: false })
        }
      },

      deleteSubscriptionRemote: async (id) => {
        set({ isSyncingUserData: true, syncError: null })
        try {
          const result = await deleteSubscription(id)

          if (result.success) {
            // Fetch fresh subscriptions from API and replace store
            await mutate('/api/subscriptions')
            set({ syncError: null })
            return { success: true }
          }

          const error = result.error || 'Failed to delete subscription'
          set({ syncError: error })
          return { success: false, error }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete subscription'
          set({ syncError: message })
          return { success: false, error: message }
        } finally {
          set({ isSyncingUserData: false })
        }
      },

      updateNotificationSettings: async (settings) => {
        // Update local state immediately for optimistic UI
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
          theme: settings.theme ?? state.theme,
        }))

        // Persist to Supabase in background
        try {
          const { updateUserSettings } = await import('@/lib/supabase/settings-actions')
          const result = await updateUserSettings({
            pushNotifications: settings.pushNotifications,
            emailNotifications: settings.emailNotifications,
            leakAlerts: settings.leakAlerts,
            biometricEnabled: settings.biometricEnabled,
            reminderDays: settings.reminderDays,
            theme: settings.theme,
            language: settings.language,
            currencyCode: settings.currencyCode,
          })

          if (!result.success) {
            console.warn('[v0] Failed to persist notification settings:', result.error)
            // Optionally revert local state on failure
          }
        } catch (error) {
          console.error('[v0] Error persisting notification settings:', error)
        }
      },

      setTheme: (theme) => set({ theme }),

      // Add subscription sheet controls
      openAddSubscriptionSheet: () => set({ isAddSubscriptionSheetOpen: true }),
      closeAddSubscriptionSheet: () => set({ isAddSubscriptionSheetOpen: false }),

      // Refresh plan from server after successful upgrade
      refreshPlanFromServer: async () => {
        const state = get()
        if (!state.currentUserId) return

        try {
          const res = await fetch('/api/hydrate-user-data')
          if (!res.ok) throw new Error('Failed to fetch user data')

          const data = await res.json()
          if (data.profile?.plan) {
            set((s) => ({
              userProfile: s.userProfile
                ? { ...s.userProfile, plan: data.profile.plan }
                : null,
            }))
          }
        } catch (error) {
          console.error('[v0] Failed to refresh plan from server:', error)
        }
      },

      // Update plan locally (for optimistic UI after payment success)
      updatePlanLocally: (plan) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, plan }
            : null,
        }))
      },

      // Update user profile with Supabase persistence
      updateUserProfileRemote: async (profileData: {
        firstName?: string
        lastName?: string
        avatarUrl?: string
      }) => {
        // Update local state immediately for optimistic UI
        set((state) => ({
          userProfile: state.userProfile ? {
            ...state.userProfile,
            first_name: profileData.firstName || state.userProfile.first_name,
            last_name: profileData.lastName || state.userProfile.last_name,
            avatar_url: profileData.avatarUrl || state.userProfile.avatar_url,
          } : null,
        }))

        // Persist to Supabase in background
        try {
          const { updateUserProfile } = await import('@/lib/supabase/settings-actions')
          const result = await updateUserProfile(profileData)

          if (!result.success) {
            console.warn('[v0] Failed to persist profile changes:', result.error)
            return { success: false, error: result.error }
          }
          return { success: true }
        } catch (error) {
          console.error('[v0] Error persisting profile:', error)
          return { success: false, error: (error as Error).message }
        }
      },

      addToast: (toast) => set((state) => {
        const id = Date.now().toString()
        // Auto-remove after 4 seconds
        setTimeout(() => {
          get().removeToast(id)
        }, 4000)
        return {
          toasts: [...state.toasts, { ...toast, id }],
        }
      }),

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),

      // Derived selector for metrics
      getMetrics: () => calculateMetrics(get().subscriptions),
    }),
    {
      name: 'renewly-store',
      version: 3,
      // Only persist non-cloud-dependent state
      partialize: (state) => ({
        theme: state.theme,
      }),
      migrate: (persistedState: any, version: number) => {
        // Handle version migrations
        if (version < 2) {
          // From v1 to v2: clear cloud-dependent state
          return {
            theme: persistedState?.theme || 'dark',
          }
        }

        if (version < 3) {
          // From v2 to v3: clear subscriptions to force fresh load
          // This ensures old persisted subscriptions with bad data shapes don't break the app
          return {
            theme: persistedState?.theme || 'dark',
          }
        }

        return persistedState
      },
    }
  )
)

export default useStore

/**
 * Store Selector Functions
 * These are used by components to derive data from the store
 */

export function selectMetrics(state: AppState) {
  return state.getMetrics()
}

export function selectUpcomingRenewals(state: AppState) {
  return state.subscriptions
    .filter((sub) => {
      if (!sub.renewalDate) return false

      const daysUntilRenewal = Math.ceil(
        (new Date(sub.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return daysUntilRenewal <= 30 && daysUntilRenewal > 0
    })
    .sort((a, b) => {
      const aTime = a.renewalDate ? new Date(a.renewalDate).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.renewalDate ? new Date(b.renewalDate).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
}

export function selectLeakReportData(state: AppState) {
  const subscriptions = state.subscriptions
  const categories: Record<string, number> = {}

  let mostExpensiveCategory = ''
  let mostExpensiveAmount = 0

  subscriptions.forEach((sub) => {
    categories[sub.category] = (categories[sub.category] || 0) + (sub.amount || 0)

    if ((sub.amount || 0) > mostExpensiveAmount) {
      mostExpensiveAmount = sub.amount || 0
      mostExpensiveCategory = sub.category
    }
  })

  const unusedSubscriptions = subscriptions.filter(
    (sub) => sub.status === 'unused' || sub.status === 'paused' || sub.status === 'cancelled'
  )

  const totalSpend = state.subscriptions.reduce((sum, s) => sum + (s.amount || 0), 0)

  return {
    categorySpending: Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalSpend > 0 ? (amount / totalSpend) * 100 : 0,
    })),
    mostExpensiveCategory,
    unusedSubscriptionsCount: unusedSubscriptions.length,
    potentialSavings: unusedSubscriptions.reduce((sum, sub) => sum + (sub.amount || 0), 0),
  }
}
