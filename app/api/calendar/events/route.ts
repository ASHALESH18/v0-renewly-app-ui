import { getUser } from '@/lib/supabase/server'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { NextResponse } from 'next/server'

type CalendarSubscriptionItem = {
  id: string
  name: string
  amount: number
  currency: string
  category: string
  logo: string | null
  color: string | null
  status: string
  billingCycle: string
}

type CalendarEventItem = {
  date: string
  subscriptions: CalendarSubscriptionItem[]
  totalAmount: number
}

function normalizeDateKey(input: string | null | undefined): string | null {
  if (!input) return null

  const raw = String(input).trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10)
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString().split('T')[0]
}

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await getUserSubscriptions()
    const grouped = new Map<string, CalendarEventItem>()

    for (const sub of subscriptions) {
      // F6C.2C: Defensive filtering - skip invalid subscriptions
      if (!sub || typeof sub !== 'object') continue

      // F6C.2C: Skip cancelled or inactive subscriptions
      if (sub.status !== 'active') continue

      // F6C.2C: Skip if no renewal_date
      const dateStr = normalizeDateKey(sub.renewal_date)
      if (!dateStr) continue

      // F6C.2C: Safely parse amount as number
      let amount = 0
      try {
        amount = Number(sub.amount ?? 0)
        if (Number.isNaN(amount)) amount = 0
      } catch {
        amount = 0
      }

      const item: CalendarSubscriptionItem = {
        id: sub.id || 'unknown',
        name: sub.name || 'Unknown',
        amount,
        currency: sub.currency || 'INR',
        category: sub.category || 'Other',
        logo: sub.logo ?? null,
        color: sub.color ?? null,
        status: sub.status || 'active',
        billingCycle: sub.billing_cycle || 'monthly',
      }

      const existing = grouped.get(dateStr)

      if (existing) {
        existing.subscriptions.push(item)
        existing.totalAmount += item.amount
      } else {
        grouped.set(dateStr, {
          date: dateStr,
          subscriptions: [item],
          totalAmount: item.amount,
        })
      }
    }

    const calendarEvents = Array.from(grouped.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // F6C.2C: Add debug logging in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[v0] F6C.2C DEBUG: Calendar filtered subscriptions', {
        totalRows: subscriptions.length,
        validEvents: calendarEvents.length,
        totalSubscriptionsInEvents: calendarEvents.reduce((sum, e) => sum + e.subscriptions.length, 0),
      })
    }

    // Always return the expected shape, even if empty
    return NextResponse.json(
      {
        calendarEvents,
        count: calendarEvents.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Calendar API error:', error)
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    )
  }
}
