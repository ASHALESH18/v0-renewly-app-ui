'use client'

import { useCallback, useEffect, useState } from 'react'

let calendarEventsCache: any = null
let notificationsCache: any = null

export function useCalendarEvents() {
  const [data, setData] = useState(calendarEventsCache)
  const [isLoading, setIsLoading] = useState(!calendarEventsCache)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let active = true

    const fetchData = async () => {
      try {
        if (!calendarEventsCache) {
          setIsLoading(true)
        }

        const res = await fetch('/api/calendar/events', { 
          credentials: 'same-origin',
          cache: 'no-store',
        })
        
        // Handle auth errors gracefully
        if (res.status === 401) {
          if (active) {
            // Use cached data if available, otherwise empty
            const fallbackData = calendarEventsCache || { calendarEvents: [], count: 0 }
            setData(fallbackData)
            setError(null)
            setIsLoading(false)
          }
          return
        }
        
        if (!res.ok) {
          throw new Error(`Failed to fetch calendar events: ${res.status}`)
        }

        const json = await res.json()
        calendarEventsCache = json

        if (active) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        console.error('[v0] Calendar fetch error:', err)
        if (active) {
          setError(err instanceof Error ? err : new Error('Unknown error'))
          // Keep cached data if available, otherwise provide empty default
          const fallbackData = calendarEventsCache || { calendarEvents: [], count: 0 }
          setData(fallbackData)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      active = false
    }
  }, [])

  return { calendarEvents: data?.calendarEvents || [], isLoading, error }
}

export function useAnalyticsData() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/analytics/data')
        if (!res.ok) throw new Error('Failed to fetch analytics data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [])

  return {
    monthlySpendData: data?.monthlySpendData || [],
    categoryBreakdown: data?.categoryBreakdown || [],
    isLoading,
    error,
  }
}

export function useFAQItems() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/public/faq')
        if (!res.ok) throw new Error('Failed to fetch FAQ items')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [])

  return {
    faqItems: data?.faqItems || [],
    isLoading,
    error,
  }
}

export function useNotifications() {
  const [data, setData] = useState<any>(notificationsCache)
  const [isLoading, setIsLoading] = useState(!notificationsCache)
  const [error, setError] = useState<any>(null)

  const fetchNotifications = useCallback(async (force = false) => {
    try {
      if (!notificationsCache || force) {
        setIsLoading(true)
      }

      // Fetch API notifications
      const [notifRes, familyStatusRes] = await Promise.all([
        fetch('/api/notifications', {
          method: 'GET',
          cache: 'no-store',
        }),
        fetch('/api/family/status', {
          cache: 'no-store',
        }),
      ])

      if (!notifRes.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const notifJson = await notifRes.json()
      let familyStatus = null

      // Family status is optional - don't break if it fails
      if (familyStatusRes.ok) {
        try {
          familyStatus = await familyStatusRes.json()
        } catch {
          // Silently fail, proceed with API notifications only
        }
      }

      // S5B.3-R: Merge derived Family invite notification with API notifications
      const { deriveFamilyInviteNotification } = await import('@/lib/notifications/derive-family-invite-notification')
      const derivedFamilyNotif = deriveFamilyInviteNotification(familyStatus)
      
      let allNotifications = notifJson.notifications || []
      let totalUnreadCount = notifJson.unreadCount || 0

      // Add derived Family invite notification if it exists
      if (derivedFamilyNotif) {
        // Check if we already have this notification in the API response
        const alreadyExists = allNotifications.some((n: any) => n.id === derivedFamilyNotif.id)
        
        if (!alreadyExists) {
          allNotifications = [derivedFamilyNotif, ...allNotifications]
          if (!derivedFamilyNotif.read) {
            totalUnreadCount += 1
          }
        }
      }

      const mergedJson = {
        notifications: allNotifications,
        unreadCount: totalUnreadCount,
      }

      notificationsCache = mergedJson
      setData(mergedJson)
      setError(null)
      return mergedJson
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        if (!notificationsCache) {
          await fetchNotifications()
        } else if (active) {
          setData(notificationsCache)
          setIsLoading(false)
        }
      } catch {
        // handled in fetchNotifications
      }
    }

    void load()

    // Refresh notifications on window focus and visibility change
    // Ensures pending Family invites are shown as soon as they appear
    const handleFocus = () => {
      if (active) {
        // Use refresh(true) to force a fresh fetch
        fetchNotifications(true).catch(() => {})
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        fetchNotifications(true).catch(() => {})
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNotifications])

  const refresh = useCallback(async () => {
    return fetchNotifications(true)
  }, [fetchNotifications])

  const clearNotificationCache = useCallback(() => {
    notificationsCache = null
  }, [])

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    refresh,
    clearNotificationCache,
  }
}

export function usePopularServices() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/subscriptions/popular')
        if (!res.ok) throw new Error('Failed to fetch popular services')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [])

  return {
    popularServices: data?.popularServices || [],
    isLoading,
    error,
  }
}
