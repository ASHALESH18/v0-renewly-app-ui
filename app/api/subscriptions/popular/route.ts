import { NextResponse } from 'next/server'
import { SERVICE_CATALOG } from '@/lib/service-catalog'

export async function GET() {
  try {
    // Popular services data is static and public.
    // Source of truth is lib/service-catalog.ts so the data is shared
    // across the app (Add Subscription flow, future surfaces).
    // Colors are fallbacks - SubscriptionIcon uses brand colors when available.
    return NextResponse.json({ popularServices: SERVICE_CATALOG })
  } catch (error) {
    console.error('[v0] Popular services API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
