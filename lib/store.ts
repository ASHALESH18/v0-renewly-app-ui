'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mutate as mutateSWR } from 'swr'
import type { Subscription } from './types'
import { mapSubscriptionRowToUI, mapUserSettingsRowToUI } from './supabase/mappers'
import { calculateMetrics } from './subscription-math'
import { getCurrencyFromCountry, getCurrencyFromLocale } from './currency'

const SUBSCRIPTIONS_SWR_KEY = '/api/subscriptions'

type SubscriptionApiRecord = Record<string, unknown>

type SubscriptionMutationResult<T = unknown> = {
  success: boolean
  data?: T | null
  error?: string
  code?: string
  current?: number
  limit?: number
}

async function readJsonSafe(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function createSubscriptionRequest(payload: {
  name: string
  category: string
  amount: number
  currency: string
  billing_cycle: string
  renewal_date?: string
  description?: string
  status?: string
}): Promise<SubscriptionMutationResult<SubscriptionApiRecord>> {
  const response = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = await readJsonSafe(response)

  if (!response.ok) {
    return {
      success: false,
      error: json?.error || 'Failed to add subscription',
      code: json?.code,
      current: json?.current,
      limit: json?.limit,
    }
  }

  return {
    success: true,
    data: json?.subscription ?? null,
  }
}

async function updateSubscriptionRequest(
  id: string,
  payload: {
    name?: string
    category?: string
    amount?: number
    currency?: string
    billing_cycle?: string
    renewal_date?: string
    description?: string
    status?: string
  }
): Promise<SubscriptionMutationResult<SubscriptionApiRecord>> {
  const response = await fetch(`/api/subscriptions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const json = await readJsonSafe(response)

  if (!response.ok) {
    return {
      success: false,
      error: json?.error || 'Failed to update subscription',
    }
  }

  return {
    success: true,
    data: json?.subscription ?? null,
  }
}

async function deleteSubscriptionRequest(id: string): Promise<SubscriptionMutationResult> {
  const response = await fetch(`/api/subscriptions/${id}`, {
    method: 'DELETE',
  })

  const json = await readJsonSafe(response)

  if (!response.ok) {
    return {
      success: false,
      error: json?.error || 'Failed to delete subscription',
    }
  }

  return { success: true }
}

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
  avatarUrl?: string
}

export interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  leakAlerts: boolean
  pushPromptSeenAt?: string | null
  reminderDays: number
  currencyCode: string
  theme: 'light' | 'dark' | 'glass'
  language: string
  biometricEnabled: boolean
}

export interface AppState {
  currentUserId: string | null
  currentUserEmail: string | null
  userProfile: UserProfile | null

  subscriptions: Subscription[]
  notificationSettings: NotificationSettings

  theme: 'light' | 'dark' | 'glass'
  toasts: Toast[]

  subscriptionLimitPaywallOpen: boolean
  subscriptionLimitPaywallData: { current: number; limit: number } | null

  isHydratingUserData: boolean
  isSyncingUserData: boolean
  hasHydratedFromCloud: boolean
  syncError: string | null
  hasMigratedLocalData: boolean

  setCurrentUser: (userId: string | null, email: string | null) => void
  setUserProfile: (profile: UserProfile | null) => void
  resetUserScopedState: () => void
  clearUserData: () => void

  hydrateAuthenticatedUserData: (userId: string, email: string) => Promise<void>
  migrateLocalDataToSupabaseOnce: (userId: string) => Promise<void>
  loadSubscriptionsFromSupabase: (subscriptions: Subscription[]) => void
  setSubscriptions: (subscriptions: Subscription[]) => void

  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void

  addSubscriptionRemote: (
    subscription: Omit<Subscription, 'id'>
  ) => Promise<{ success: boolean; error?: string; code?: string; current?: number; limit?: number }>
  updateSubscriptionRemote: (
    id: string,
    subscription: Partial<Subscription>
  ) => Promise<{ success: boolean; error?: string }>
  deleteSubscriptionRemote: (id: string) => Promise<{ success: boolean; error?: string }>

  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void

  setTheme: (theme: 'light' | 'dark' | 'glass') => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  openSubscriptionLimitPaywall: (data: { current: number; limit: number }) => void
  closeSubscriptionLimitPaywall: () => void

  isAddSubscriptionSheetOpen: boolean
  openAddSubscriptionSheet: () => void
  closeAddSubscriptionSheet: () => void

  refreshPlanFromServer: () => Promise<void>
  updatePlanLocally: (plan: 'free' | 'pro' | 'family' | 'enterprise') => void
  updateUserProfileRemote: (profileData: {
    firstName?: string
    lastName?: string
    avatarUrl?: string
  }) => Promise<{ success: boolean; error?: string }>

  getMetrics: () => ReturnType<typeof calculateMetrics>
}

function inferInitialCurrency(): string {
  if (typeof navigator === 'undefined') return 'INR'
  return getCurrencyFromLocale(navigator.language || navigator.languages?.[0])
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      currentUserEmail: null,
      userProfile: null,
      subscriptions: [],
      notificationSettings: {
        pushNotifications: false,
        pushPromptSeenAt: null,
        emailNotifications: true,
        leakAlerts: true,
        reminderDays: 3,
        currencyCode: inferInitialCurrency(),
        theme: 'dark',
        language: 'en',
        biometricEnabled: false,
      },
      theme: 'dark',
      toasts: [],
      subscriptionLimitPaywallOpen: false,
      subscriptionLimitPaywallData: null,
      isHydratingUserData: false,
      isSyncingUserData: false,
      hasHydratedFromCloud: false,
      syncError: null,
      hasMigratedLocalData: false,
      isAddSubscriptionSheetOpen: false,

      setCurrentUser: (userId, email) =>
        set({
          currentUserId: userId,
          currentUserEmail: email,
        }),

      setUserProfile: (profile) => set({ userProfile: profile }),

      resetUserScopedState: () =>
        set({
          subscriptions: [],
          userProfile: null,
          isHydratingUserData: false,
          hasHydratedFromCloud: false,
          hasMigratedLocalData: false,
          syncError: null,
        }),

      clearUserData: () =>
        set({
          currentUserId: null,
          currentUserEmail: null,
          subscriptions: [],
          userProfile: null,
          isHydratingUserData: false,
          hasHydratedFromCloud: false,
          hasMigratedLocalData: false,
          syncError: null,
        }),

      hydrateAuthenticatedUserData: async (userId, email) => {
        const state = get()

        if (state.isHydratingUserData) return

        if (state.currentUserId && state.currentUserId !== userId) {
          set({ isHydratingUserData: true, syncError: null })
          get().resetUserScopedState()
        }

        if (state.hasHydratedFromCloud && state.currentUserId === userId) {
          return
        }

        set({
          isHydratingUserData: true,
          syncError: null,
          currentUserId: userId,
          currentUserEmail: email,
        })

        try {
          const response = await fetch('/api/hydrate-user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, email }),
          })

          if (!response.ok) {
            console.warn('[v0] Hydration endpoint not available, using default state')
            set({ hasHydratedFromCloud: true })
            return
          }

          const { profile, settings, subscriptions, shouldMigrate } = await response.json()

          let savedTimeZone: string | undefined

          if (settings) {
            const uiSettings = mapUserSettingsRowToUI(settings)
            savedTimeZone = uiSettings.timeZone
            const inferredCurrency = uiSettings.currencyCode || getCurrencyFromCountry(profile?.country_code) || getCurrencyFromLocale(uiSettings.locale)
            set({
              notificationSettings: { ...uiSettings, currencyCode: inferredCurrency },
              theme: uiSettings.theme || get().theme,
            })
          }

          if (profile) {
            const fullName =
              [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim() ||
              profile.full_name ||
              email.split('@')[0]

            set({
              userProfile: {
                name: fullName,
                email: profile.email,
                plan: profile.plan,
                avatarUrl: profile.avatar_url || undefined,
                timeZone: savedTimeZone || profile.time_zone || undefined,
              },
            })
          }

          const uiSubscriptions = Array.isArray(subscriptions)
            ? subscriptions.map(mapSubscriptionRowToUI)
            : []

          set({ subscriptions: uiSubscriptions })
          void mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions: uiSubscriptions }, false)

          set({ hasHydratedFromCloud: true })

          if (shouldMigrate) {
            await get().migrateLocalDataToSupabaseOnce(userId)
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Hydration failed'
          console.warn('[v0] Hydration error (non-critical):', message)
          set({ hasHydratedFromCloud: true })
        } finally {
          set({ isHydratingUserData: false })
        }
      },

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
            await get().hydrateAuthenticatedUserData(userId, state.currentUserEmail || '')
          }
        } catch (error) {
          console.error('[v0] Migration error:', error)
        }
      },

      loadSubscriptionsFromSupabase: (subscriptions) => {
        set({ subscriptions })
        void mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions }, false)
      },

      setSubscriptions: (subscriptions) => {
        set({ subscriptions })
        void mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions }, false)
      },

      addSubscription: (subscription) =>
        set((state) => ({
          subscriptions: [
            ...state.subscriptions,
            {
              ...subscription,
              id: Date.now().toString(),
            },
          ],
        })),

      updateSubscription: (id, updates) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((sub) =>
            sub.id === id ? { ...sub, ...updates } : sub
          ),
        })),

      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((sub) => sub.id !== id),
        })),

      addSubscriptionRemote: async (subscription) => {
        set({ isSyncingUserData: true, syncError: null })

        try {
          const result = await createSubscriptionRequest({
            name: subscription.name,
            category: subscription.category,
            amount: subscription.amount,
            currency: subscription.currency || get().notificationSettings.currencyCode || 'INR',
            billing_cycle: subscription.billingCycle,
            renewal_date: subscription.renewalDate,
            description: subscription.description,
            status: subscription.status ?? 'active',
          })

          if (result.success && result.data) {
            const createdSubscription = mapSubscriptionRowToUI(result.data as any)

            const nextSubscriptions = [
              createdSubscription,
              ...get().subscriptions.filter((s) => s.id !== createdSubscription.id),
            ]

            set({ subscriptions: nextSubscriptions })
            await mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions: nextSubscriptions }, false)

            return { success: true }
          }

          set({ syncError: result.error || 'Failed to add subscription' })

          return {
            success: false,
            error: result.error,
            code: result.code,
            current: result.current,
            limit: result.limit,
          }
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
          const result = await updateSubscriptionRequest(id, {
            name: updates.name,
            amount: updates.amount,
            billing_cycle: updates.billingCycle,
            renewal_date: updates.renewalDate,
            description: updates.description,
            status: updates.status,
            currency: updates.currency,
            category: updates.category,
          })

          if (result.success) {
            const updatedFromServer = result.data
              ? mapSubscriptionRowToUI(result.data as any)
              : null

            const nextSubscriptions = get().subscriptions.map((sub) =>
              sub.id === id
                ? {
                  ...sub,
                  ...updates,
                  ...(updatedFromServer || {}),
                }
                : sub
            )

            set({ subscriptions: nextSubscriptions })
            await mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions: nextSubscriptions }, false)

            return { success: true }
          }

          set({ syncError: result.error || 'Failed to update subscription' })
          return { success: false, error: result.error }
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
          const result = await deleteSubscriptionRequest(id)

          if (result.success) {
            const nextSubscriptions = get().subscriptions.filter((sub) => sub.id !== id)

            set({ subscriptions: nextSubscriptions })
            await mutateSWR(SUBSCRIPTIONS_SWR_KEY, { subscriptions: nextSubscriptions }, false)

            return { success: true }
          }

          set({ syncError: result.error || 'Failed to delete subscription' })
          return { success: false, error: result.error }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete subscription'
          set({ syncError: message })
          return { success: false, error: message }
        } finally {
          set({ isSyncingUserData: false })
        }
      },

      updateNotificationSettings: async (settings) => {
        set((state) => ({
          notificationSettings: { ...state.notificationSettings, ...settings },
          theme: settings.theme ?? state.theme,
        }))

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
          }
        } catch (error) {
          console.error('[v0] Error persisting notification settings:', error)
        }
      },

      setTheme: (theme) => set({ theme }),

      openAddSubscriptionSheet: () => set({ isAddSubscriptionSheetOpen: true }),
      closeAddSubscriptionSheet: () => set({ isAddSubscriptionSheetOpen: false }),

      openSubscriptionLimitPaywall: (data) =>
        set({
          subscriptionLimitPaywallOpen: true,
          subscriptionLimitPaywallData: data,
        }),

      closeSubscriptionLimitPaywall: () =>
        set({
          subscriptionLimitPaywallOpen: false,
          subscriptionLimitPaywallData: null,
        }),

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

      updatePlanLocally: (plan) => {
        set((state) => ({
          userProfile: state.userProfile
            ? { ...state.userProfile, plan }
            : null,
        }))
      },

      updateUserProfileRemote: async (profileData) => {
        const currentProfile = get().userProfile

        if (currentProfile) {
          const existingParts = currentProfile.name.trim().split(/\s+/).filter(Boolean)
          const existingFirst = existingParts[0] || ''
          const existingLast = existingParts.slice(1).join(' ')

          const nextFirst = profileData.firstName ?? existingFirst
          const nextLast = profileData.lastName ?? existingLast
          const nextName = [nextFirst, nextLast].filter(Boolean).join(' ').trim() || currentProfile.name

          set({
            userProfile: {
              ...currentProfile,
              name: nextName,
              avatarUrl: profileData.avatarUrl ?? currentProfile.avatarUrl,
            },
          })
        }

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

      addToast: (toast) =>
        set((state) => {
          const id = Date.now().toString()
          setTimeout(() => {
            get().removeToast(id)
          }, 4000)

          return {
            toasts: [...state.toasts, { ...toast, id }],
          }
        }),

      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      getMetrics: () => calculateMetrics(get().subscriptions),
    }),
    {
      name: 'renewly-store',
      version: 3,
      partialize: (state) => ({
        theme: state.theme,
      }),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          return {
            theme: persistedState?.theme || 'dark',
          }
        }

        if (version < 3) {
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
