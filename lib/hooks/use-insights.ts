'use client'

import { useEffect, useRef, useState } from 'react'
import type { Insight, InsightCategory, InsightSeverity } from '@/lib/insights/insight-types'

interface UseInsightsOptions {
  category?: InsightCategory
  maxInsights?: number
  enabled?: boolean
}

interface UseInsightsResult {
  insights: Insight[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useInsights(options: UseInsightsOptions = {}): UseInsightsResult {
  const { category, maxInsights = 10, enabled = true } = options
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchInFlightRef = useRef(false)
  const lastFetchRef = useRef<number>(0)

  const fetchInsights = async () => {
    // Prevent duplicate fetches
    if (fetchInFlightRef.current) {
      return
    }

    // Simple rate limiting: don't fetch more than once per 5 seconds
    const now = Date.now()
    if (lastFetchRef.current && now - lastFetchRef.current < 5000) {
      return
    }

    fetchInFlightRef.current = true
    lastFetchRef.current = now

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/insights')

      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized')
          setInsights([])
          return
        }
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.warning || 'Failed to generate insights')
        setInsights([])
        return
      }

      let filteredInsights = data.insights || []

      // Filter by category if specified
      if (category) {
        filteredInsights = filteredInsights.filter((i: Insight) => i.category === category)
      }

      // Limit to maxInsights
      if (maxInsights && filteredInsights.length > maxInsights) {
        filteredInsights = filteredInsights.slice(0, maxInsights)
      }

      setInsights(filteredInsights)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch insights'
      setError(message)
      setInsights([])
    } finally {
      setLoading(false)
      fetchInFlightRef.current = false
    }
  }

  // Fetch on mount and when options change
  useEffect(() => {
    if (!enabled) {
      setInsights([])
      return
    }

    fetchInsights()
  }, [category, maxInsights, enabled])

  return {
    insights,
    loading,
    error,
    refresh: fetchInsights,
  }
}
