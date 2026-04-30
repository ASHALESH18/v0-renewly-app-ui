import { NextResponse } from 'next/server'
import { FALLBACK_INR_RATES } from '@/lib/currency'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const TARGETS = 'USD,EUR,GBP,AUD,CAD,SGD,JPY'
const EXCHANGE_RATE_TIMEOUT_MS = 4000

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), EXCHANGE_RATE_TIMEOUT_MS)

    try {
      const response = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${TARGETS}`, {
        cache: 'no-store',
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new Error(`Exchange-rate fetch failed with ${response.status}`)
      }

      const data = await response.json()
      const rates = {
        ...FALLBACK_INR_RATES,
        ...(data?.rates || {}),
        INR: 1,
      }

      return NextResponse.json({
        base: 'INR',
        rates,
        date: data?.date || null,
        source: 'frankfurter',
        fallback: false,
      })
    } finally {
      clearTimeout(timeout)
    }
  } catch {
    return NextResponse.json({
      base: 'INR',
      rates: FALLBACK_INR_RATES,
      date: null,
      source: 'fallback',
      fallback: true,
    })
  }
}
