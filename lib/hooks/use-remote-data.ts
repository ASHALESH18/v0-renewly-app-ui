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

        const res = await fetch('/api/calendar/events')
        
        // Handle auth errors gracefully
        if (res.status === 401) {
          if (active) {
            setData({ calendarEvents: [] })
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
          // Return empty data to prevent crashes
          setData({ calendarEvents: [] })
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

      const res = await fetch('/api/notifications', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!res.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const json = await res.json()
      notificationsCache = json
      setData(json)
      setError(null)
      return json
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

    return () => {
      active = false
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
