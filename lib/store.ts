'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Subscription } from './types'
import type { ProfileRow, UserSettingsRow } from './supabase/database.types'
import { mapSubscriptionRowToUI, mapUserSettingsRowToUI } from './supabase/mappers'
import { calculateMetrics } from './subscription-math'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

export interface UserProfile {
  email: string
  name: string
  plan: 'free' | 'premium'
}

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  leakAlerts: boolean
  reminderDays: number
  currencyCode: string
  theme: 'light' | 'dark'
  language: string
  biometricEnabled: boolean
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
  theme: 'light' | 'dark'
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

  // Actions - Cloud Data
  hydrateAuthenticatedUserData: (userId: string, email: string) => Promise<void>
  migrateLocalDataToSupabaseOnce: (userId: string) => Promise<void>
  loadSubscriptionsFromSupabase: (subscriptions: Subscription[]) => void

  // Actions - Subscriptions
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void

  // Actions - Settings
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void

  // Actions - UI
  setTheme: (theme: 'light' | 'dark') => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

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

      // Main hydration function for authenticated users
      hydrateAuthenticatedUserData: async (userId, email) => {
        const state = get()

        // Prevent cross-user data leakage: if user ID changed, reset state
        if (state.currentUserId && state.currentUserId !== userId) {
          console.log('[v0] User changed, resetting state:', state.currentUserId, '->', userId)
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

          if (!response.ok) throw new Error('Failed to hydrate user data')

          const { profile, settings, subscriptions, shouldMigrate } = await response.json()

          // Set profile
          if (profile) {
            set({
              userProfile: {
                name: profile.full_name || email.split('@')[0],
                email: profile.email,
                plan: profile.plan,
              },
            })
          }

          // Set settings
          if (settings) {
            const uiSettings = mapUserSettingsRowToUI(settings)
            set({ notificationSettings: uiSettings })
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
          console.error('[v0] Hydration error:', message)
          set({ syncError: message })
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

      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings },
      })),

      setTheme: (theme) => set({ theme }),

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
      version: 2,
      // Only persist non-cloud-dependent state
      partialize: (state) => ({
        theme: state.theme,
      }),
    }
  )
)

export default useStore
