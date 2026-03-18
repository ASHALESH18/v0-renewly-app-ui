'use client'

import { useEffect, useState } from 'react'

export function useCalendarEvents() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/calendar/events')
        if (!res.ok) throw new Error('Failed to fetch calendar events')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [])

  return {
    calendarEvents: data?.calendarEvents || [],
    isLoading,
    error
  }
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
    
    fetchData()
  }, [])

  return {
    monthlySpendData: data?.monthlySpendData || [],
    categoryBreakdown: data?.categoryBreakdown || [],
    isLoading,
    error
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
    
    fetchData()
  }, [])

  return {
    faqItems: data?.faqItems || [],
    isLoading,
    error
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
    
    fetchData()
  }, [])

  return {
    popularServices: data?.popularServices || [],
    isLoading,
    error
  }
}
