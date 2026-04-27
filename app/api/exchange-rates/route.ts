import { NextResponse } from 'next/server'
import { FALLBACK_INR_RATES } from '@/lib/currency'

export const revalidate = 21600

const TARGETS = 'USD,EUR,GBP,AUD,CAD,SGD,JPY'

export async function GET() {
  try {
    const response = await fetch(`https://api.frankfurter.app/latest?from=INR&to=${TARGETS}`, {
      next: { revalidate: 21600 },
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
  } catch (error) {
    return NextResponse.json({
      base: 'INR',
      rates: FALLBACK_INR_RATES,
      date: null,
      source: 'fallback',
      fallback: true,
    })
  }
}
