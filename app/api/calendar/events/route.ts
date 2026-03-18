import { getUser } from '@/lib/supabase/server'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch real subscriptions from Supabase
    const subscriptions = await getUserSubscriptions()

    // Generate calendar events from subscription renewal dates
    const calendarEvents = subscriptions
      .filter(sub => sub.renewal_date)
      .map(sub => {
        const renewalDate = new Date(sub.renewal_date)
        const dateStr = renewalDate.toISOString().split('T')[0]
        
        return {
          date: dateStr,
          subscription: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          category: sub.category,
        }
      })
      // Group by date
      .reduce((acc, event) => {
        const existing = acc.find(e => e.date === event.date)
        if (existing) {
          existing.subscriptions.push({
            name: event.subscription,
            amount: event.amount,
            currency: event.currency,
            category: event.category,
          })
          existing.totalAmount += event.amount
        } else {
          acc.push({
            date: event.date,
            subscriptions: [{
              name: event.subscription,
              amount: event.amount,
              currency: event.currency,
              category: event.category,
            }],
            totalAmount: event.amount,
          })
        }
        return acc
      }, [])
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
