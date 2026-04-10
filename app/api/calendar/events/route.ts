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

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await getUserSubscriptions()

    const calendarEvents = subscriptions
      .filter((sub) => sub.renewal_date)
      .reduce<CalendarEventItem[]>((acc, sub) => {
        const renewalDate = new Date(sub.renewal_date as string)
        const dateStr = renewalDate.toISOString().split('T')[0]

        const item: CalendarSubscriptionItem = {
          id: sub.id,
          name: sub.name,
          amount: Number(sub.amount ?? 0),
          currency: sub.currency || '₹',
          category: sub.category || 'Other',
          logo: sub.logo,
          color: sub.color,
          status: sub.status,
          billingCycle: sub.billing_cycle,
        }

        const existing = acc.find((event) => event.date === dateStr)

        if (existing) {
          existing.subscriptions.push(item)
          existing.totalAmount += item.amount
        } else {
          acc.push({
            date: dateStr,
            subscriptions: [item],
            totalAmount: item.amount,
          })
        }

        return acc
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      calendarEvents,
      count: calendarEvents.length,
    })
  } catch (error) {
    console.error('[v0] Calendar API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}