import useSWR from 'swr'

export function useCalendarEvents() {
  const { data, error, isLoading } = useSWR('/api/calendar/events')
  
  return {
    calendarEvents: data?.calendarEvents || [],
    isLoading,
    error
  }
}

export function useAnalyticsData() {
  const { data, error, isLoading } = useSWR('/api/analytics/data')
  
  return {
    monthlySpendData: data?.monthlySpendData || [],
    categoryBreakdown: data?.categoryBreakdown || [],
    isLoading,
    error
  }
}

export function useFAQItems() {
  const { data, error, isLoading } = useSWR('/api/public/faq')
  
  return {
    faqItems: data?.faqItems || [],
    isLoading,
    error
  }
}

export function usePopularServices() {
  const { data, error, isLoading } = useSWR('/api/subscriptions/popular')
  
  return {
    popularServices: data?.popularServices || [],
    isLoading,
    error
  }
}
