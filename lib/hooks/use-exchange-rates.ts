import useSWR from 'swr'
import { FALLBACK_INR_RATES, type ExchangeRates } from '@/lib/currency'

type ExchangeRateResponse = {
  base: string
  rates: ExchangeRates
  date?: string | null
  source?: string
  fallback?: boolean
}

const fetcher = async (url: string): Promise<ExchangeRateResponse> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Unable to fetch exchange rates')
  return response.json()
}

export function useExchangeRates() {
  const { data, error, isLoading, mutate } = useSWR<ExchangeRateResponse>(
    '/api/exchange-rates',
    fetcher,
    {
      refreshInterval: 6 * 60 * 60 * 1000,
      revalidateOnFocus: false,
      fallbackData: {
        base: 'INR',
        rates: FALLBACK_INR_RATES,
        date: null,
        source: 'fallback',
        fallback: true,
      },
    }
  )

  return {
    rates: data?.rates || FALLBACK_INR_RATES,
    date: data?.date || null,
    source: data?.source || 'fallback',
    isFallback: Boolean(data?.fallback),
    isLoading,
    error,
    mutate,
  }
}
