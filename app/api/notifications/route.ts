import { getUser } from '@/lib/supabase/server'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { NextResponse } from 'next/server'

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch real subscriptions from Supabase
    const subscriptions = await getUserSubscriptions()

    const notifications: Notification[] = []
    const today = new Date()
    
    // Generate notifications based on upcoming renewals
    subscriptions.forEach(sub => {
      if (!sub.renewal_date || sub.status !== 'active') return
      
      const renewalDate = new Date(sub.renewal_date)
      const daysUntilRenewal = Math.ceil(
        (renewalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )

      // Renewal in 3 days
      if (daysUntilRenewal === 3) {
        notifications.push({
          id: `reminder-3-${sub.id}`,
          type: 'reminder',
          title: 'Upcoming Renewal',
          message: `${sub.name} renews in 3 days (${sub.currency}${sub.amount})`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      }

      // Renewal tomorrow
      if (daysUntilRenewal === 1) {
        notifications.push({
          id: `reminder-1-${sub.id}`,
          type: 'alert',
          title: 'Renewal Tomorrow',
          message: `${sub.name} renews tomorrow - ${sub.currency}${sub.amount} will be charged`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      }

      // Renewal today
      if (daysUntilRenewal === 0) {
        notifications.push({
          id: `today-${sub.id}`,
          type: 'alert',
          title: 'Renewal Today',
          message: `${sub.name} is being renewed today for ${sub.currency}${sub.amount}`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      }

      // Past due (renewal date passed)
      if (daysUntilRenewal < 0 && daysUntilRenewal > -7) {
        notifications.push({
          id: `past-${sub.id}`,
          type: 'info',
          title: 'Recent Renewal',
          message: `${sub.name} renewed ${Math.abs(daysUntilRenewal)} day(s) ago`,
          date: renewalDate.toISOString(),
          read: true,
          subscriptionId: sub.id,
        })
      }
    })

    // Sort by date (most recent first) and urgency
    const sortedNotifications = notifications.sort((a, b) => {
      // Unread first
      if (!a.read && b.read) return -1
      if (a.read && !b.read) return 1
      // Then by date
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    })

    return NextResponse.json({
      notifications: sortedNotifications,
      unreadCount: notifications.filter(n => !n.read).length,
    })
  } catch (error) {
    console.error('[v0] Notifications API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
