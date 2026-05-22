'use client'

import { useCallback, useEffect, useState } from 'react'

let calendarEventsCache: any = null
let notificationsCache: any = null

// S5B.4-R: Request throttling and deduplication for notifications and family status
const REQUEST_CACHE_TTL = 20000 // 20 seconds for regular requests
const FOCUS_CACHE_TTL = 30000 // 30 seconds for focus/visibility changes
const BELL_OPEN_TTL = 10000 // 10 seconds for bell open

let notificationsFetchCache = {
  data: null as any,
  fetchedAt: 0,
  inFlight: null as Promise<any> | null,
  controller: null as AbortController | null,
}

let familyStatusFetchCache = {
  data: null as any,
  fetchedAt: 0,
  inFlight: null as Promise<any> | null,
  controller: null as AbortController | null,
}

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

  // S5B.4-R: Fetch with throttling and deduplication to prevent 504 storm
  // F8-lite: Added AbortController for canceling stale requests
  const fetchNotificationsThrottled = useCallback(async (
    force = false,
    ttl = REQUEST_CACHE_TTL
  ) => {
    const now = Date.now()
    const cacheExpired = now - notificationsFetchCache.fetchedAt > ttl
    const isForceRefresh = force

    // If request is already in flight, return same promise (deduplication)
    if (notificationsFetchCache.inFlight && !isForceRefresh) {
      return notificationsFetchCache.inFlight
    }

    // F8-lite: Abort previous stale request before starting new one
    if (notificationsFetchCache.controller && isForceRefresh) {
      notificationsFetchCache.controller.abort()
      notificationsFetchCache.inFlight = null
    }

    // If cache is fresh and not forced, use cached data
    if (!cacheExpired && !isForceRefresh && notificationsFetchCache.data) {
      return notificationsFetchCache.data
    }

    // F8-lite: Create AbortController for this fetch
    const controller = new AbortController()
    notificationsFetchCache.controller = controller

    // Create the actual fetch promise
    const fetchPromise = (async () => {
      try {
        if (!notificationsCache || force) {
          setIsLoading(true)
        }

        const [notifRes, familyStatusRes] = await Promise.all([
          fetch('/api/notifications', {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          }),
          fetch('/api/family/status', {
            cache: 'no-store',
            signal: controller.signal,
          }),
        ])

        if (!notifRes.ok) {
          // 504 or other error - use last cached state
          console.warn('[notifications] HTTP error:', notifRes.status)
          if (notificationsFetchCache.data) {
            return notificationsFetchCache.data
          }
          throw new Error(`Failed to fetch notifications: ${notifRes.status}`)
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

        // Add derived Family invite notification only if the API did not already
        // return a persistent notification for the same invite. This prevents the
        // bell from showing one stored invite plus one client-derived duplicate.
        if (derivedFamilyNotif) {
          const inviteId = familyStatus?.pendingInvite?.id
          const alreadyExists = allNotifications.some((n: any) =>
            n.id === derivedFamilyNotif.id ||
            (inviteId && (n.entityId === inviteId || n.entity_id === inviteId || n.metadata?.inviteId === inviteId))
          )
          
          if (!alreadyExists) {
            allNotifications = [{ ...derivedFamilyNotif, category: 'family', severity: 'info' }, ...allNotifications]
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
        notificationsFetchCache.data = mergedJson
        notificationsFetchCache.fetchedAt = Date.now()
        setData(mergedJson)
        setError(null)
        return mergedJson
      } catch (err) {
        // F8-lite: Don't log abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return notificationsFetchCache.data
        }
        console.error('[notifications] fetch error:', err)
        setError(err)
        // Return last cached state on error
        if (notificationsFetchCache.data) {
          return notificationsFetchCache.data
        }
        throw err
      } finally {
        setIsLoading(false)
        notificationsFetchCache.inFlight = null
        notificationsFetchCache.controller = null
      }
    })()

    notificationsFetchCache.inFlight = fetchPromise
    return fetchPromise
  }, [])

  // Public refresh function with explicit control
  const refresh = useCallback(async (force = false) => {
    return fetchNotificationsThrottled(force, REQUEST_CACHE_TTL)
  }, [fetchNotificationsThrottled])

  // Public refresh for bell open (tighter TTL)
  const refreshForBellOpen = useCallback(async () => {
    return fetchNotificationsThrottled(false, BELL_OPEN_TTL)
  }, [fetchNotificationsThrottled])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        // Always fetch on first mount to bootstrap app-shell notification state
        // Use force=true to ensure fresh fetch, not stale cache
        await fetchNotificationsThrottled(true, REQUEST_CACHE_TTL)
      } catch {
        // handled in fetchNotificationsThrottled
      }
    }

    void load()

    // S5B.4-R: Throttled focus/visibility handlers to prevent 504 storm
    // Only refetch if cache is older than FOCUS_CACHE_TTL
    const handleFocus = () => {
      if (active) {
        const now = Date.now()
        const shouldRefetch = now - notificationsFetchCache.fetchedAt > FOCUS_CACHE_TTL
        if (shouldRefetch) {
          fetchNotificationsThrottled(false, FOCUS_CACHE_TTL).catch(() => {})
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && active) {
        const now = Date.now()
        const shouldRefetch = now - notificationsFetchCache.fetchedAt > FOCUS_CACHE_TTL
        if (shouldRefetch) {
          fetchNotificationsThrottled(false, FOCUS_CACHE_TTL).catch(() => {})
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      active = false
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNotificationsThrottled])

  const clearNotificationCache = useCallback(() => {
    notificationsCache = null
    notificationsFetchCache.data = null
    notificationsFetchCache.fetchedAt = 0
  }, [])

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    refresh,
    refreshForBellOpen,
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
