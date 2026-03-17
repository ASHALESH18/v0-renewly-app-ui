'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Subscription } from './types'
import { initialSubscriptions } from './init-data'

export interface AppState {
  subscriptions: Subscription[]
  notificationSettings: {
    emailReminders: boolean
    pushNotifications: boolean
    leakAlerts: boolean
  }
  theme: 'light' | 'dark'
  
  // Actions
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void
  deleteSubscription: (id: string) => void
  updateNotificationSettings: (settings: Partial<AppState['notificationSettings']>) => void
  setTheme: (theme: 'light' | 'dark') => void
  initializeWithDefaults: () => void
}

const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      subscriptions: [],
      notificationSettings: {
        emailReminders: true,
        pushNotifications: true,
        leakAlerts: true,
      },
      theme: 'dark',
      
      addSubscription: (subscription) => set((state) => ({
        subscriptions: [
          ...state.subscriptions,
          {
            ...subscription,
            id: Date.now().toString(),
          }
        ]
      })),
      
      updateSubscription: (id, updates) => set((state) => ({
        subscriptions: state.subscriptions.map(sub =>
          sub.id === id ? { ...sub, ...updates } : sub
        )
      })),
      
      deleteSubscription: (id) => set((state) => ({
        subscriptions: state.subscriptions.filter(sub => sub.id !== id)
      })),
      
      updateNotificationSettings: (settings) => set((state) => ({
        notificationSettings: { ...state.notificationSettings, ...settings }
      })),
      
      setTheme: (theme) => set({ theme }),
      
      initializeWithDefaults: () => set((state) => {
        // Only initialize if no subscriptions exist
        if (state.subscriptions.length === 0) {
          return { subscriptions: initialSubscriptions }
        }
        return state
      }),
    }),
    {
      name: 'renewly-store',
      version: 1,
    }
  )
)

// Initialize with default data on first load
if (typeof window !== 'undefined') {
  const hasHydrated = useStore.persist?.getOptions?.()?.getStorage?.()?.getItem?.('renewly-store')
  if (!hasHydrated) {
    useStore.getState().initializeWithDefaults()
  }
}

// Derived selectors
export const selectMetrics = (state: AppState) => {
  const subscriptions = state.subscriptions
  const totalMonthly = subscriptions.reduce((sum, sub) => sum + sub.amount, 0)
  const totalYearly = subscriptions.reduce((sum, sub) => {
    if (sub.billingCycle === 'yearly') return sum + sub.amount
    if (sub.billingCycle === 'monthly') return sum + (sub.amount * 12)
    return sum
  }, 0)
  
  // Calculate leak score (potential savings from unused subscriptions)
  const leakScore = subscriptions.filter(sub => sub.status === 'unused').length * 15
  
  return {
    activeSubscriptions: subscriptions.filter(sub => sub.status === 'active').length,
    totalMonthly,
    totalYearly,
    leakScore,
    savingsPotential: subscriptions
      .filter(sub => sub.status === 'unused' || sub.status === 'paused')
      .reduce((sum, sub) => sum + sub.amount, 0)
  }
}

export const selectLeakReportData = (state: AppState) => {
  const unused = state.subscriptions.filter(sub => sub.status === 'unused')
  const paused = state.subscriptions.filter(sub => sub.status === 'paused')
  
  return {
    unused,
    paused,
    overallScore: Math.max(0, 100 - (unused.length * 10 + paused.length * 5)),
  }
}

export const selectUpcomingRenewals = (state: AppState) => {
  const today = new Date()
  const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  
  return state.subscriptions
    .filter(sub => {
      if (!sub.renewalDate) return false
      const renewalDate = new Date(sub.renewalDate)
      return renewalDate >= today && renewalDate <= next30Days
    })
    .sort((a, b) => new Date(a.renewalDate!).getTime() - new Date(b.renewalDate!).getTime())
}

export const selectCalendarEvents = (state: AppState) => {
  return state.subscriptions
    .filter(sub => sub.renewalDate)
    .map(sub => ({
      date: sub.renewalDate!,
      subscription: sub,
      type: 'renewal' as const
    }))
}

export const selectNotifications = (state: AppState) => {
  const upcoming = selectUpcomingRenewals(state)
  const leakData = selectLeakReportData(state)
  
  const notifications = [
    ...upcoming.slice(0, 2).map(sub => ({
      id: `upcoming-${sub.id}`,
      type: 'renewal' as const,
      title: `${sub.name} renewal coming up`,
      message: `${sub.name} will renew on ${new Date(sub.renewalDate!).toLocaleDateString()}`,
      timestamp: new Date(),
      read: false,
    })),
    ...(leakData.unused.length > 0 ? [{
      id: 'leak-alert',
      type: 'leak' as const,
      title: `Found ${leakData.unused.length} unused subscription(s)`,
      message: `You could save ₹${leakData.unused.reduce((sum, sub) => sum + sub.amount, 0)}/mo by canceling unused services`,
      timestamp: new Date(),
      read: false,
    }] : []),
  ]
  
  return notifications
}

export default useStore
