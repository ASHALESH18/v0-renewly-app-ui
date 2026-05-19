import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
import { getUserNotifications as getLegacyNotifications, markNotificationRead as legacyMark, markAllNotificationsRead as legacyMarkAll } from '@/lib/supabase/repositories/notifications'
import { getUserNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/notification-service'
import { formatCurrencyAmount } from '@/lib/currency'
import type { NotificationStateRow, SubscriptionRow } from '@/lib/supabase/database.types'
import { getPendingFamilyInviteForUserEmail } from '@/lib/family/get-pending-family-invite'

interface Notification {
  id: string
  type: 'reminder' | 'alert' | 'info'
  title: string
  message: string
  date: string
  read: boolean
  subscriptionId?: string
  actionHref?: string
}

type NotificationAction = 'mark_read' | 'mark_all_read' | 'dismiss'

const DAY_MS = 1000 * 60 * 60 * 24

function startOfDay(date: Date) {
  const value = new Date(date)
  value.setHours(0, 0, 0, 0)
  return value
}

function normalizeRenewalDate(input: string | null) {
  if (!input) return null

  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return null

  return startOfDay(date)
}

function sortNotifications(items: Notification[]) {
  return [...items].sort((a, b) => {
    if (!a.read && b.read) return -1
    if (a.read && !b.read) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })
}

function buildNotifications(subscriptions: SubscriptionRow[], familyInvites?: any[]): Notification[] {
  const today = startOfDay(new Date())
  const notifications: Notification[] = []

  // Add Family invite notifications
  if (familyInvites && familyInvites.length > 0) {
    for (const invite of familyInvites) {
      if (invite.status === 'pending') {
        const ownerEmail = invite.family_owner?.email || 'Family owner'
        notifications.push({
          id: `family-invite-${invite.id}`,
          type: 'info',
          title: 'Renewly Family invite',
          message: `${ownerEmail} invited you to join their Renewly Family plan.`,
          date: invite.created_at || new Date().toISOString(),
          read: false,
          actionHref: '/app/family',
        })
      }
    }
  }

  for (const sub of subscriptions) {
    if (!sub.renewal_date || sub.status !== 'active') continue

    const renewalDate = normalizeRenewalDate(sub.renewal_date)
    if (!renewalDate) continue

    const daysUntilRenewal = Math.round(
      (renewalDate.getTime() - today.getTime()) / DAY_MS
    )

    // Format the amount with currency
    const formattedAmount = formatCurrencyAmount(sub.amount, sub.currency)

    // Generate notifications for upcoming renewals within 7 days
    if (daysUntilRenewal >= 0 && daysUntilRenewal <= 7) {
      if (daysUntilRenewal === 0) {
        notifications.push({
          id: `today-${sub.id}`,
          type: 'alert',
          title: 'Renewal Today',
          message: `${sub.name} is being renewed today for ${formattedAmount}`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      } else if (daysUntilRenewal === 1) {
        notifications.push({
          id: `reminder-1-${sub.id}`,
          type: 'alert',
          title: 'Renewal Tomorrow',
          message: `${sub.name} renews tomorrow - ${formattedAmount} will be charged`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      } else if (daysUntilRenewal <= 3) {
        notifications.push({
          id: `reminder-${daysUntilRenewal}-${sub.id}`,
          type: 'reminder',
          title: 'Upcoming Renewal',
          message: `${sub.name} renews in ${daysUntilRenewal} days (${formattedAmount})`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      } else {
        // 4-7 days away - info notification
        notifications.push({
          id: `upcoming-${daysUntilRenewal}-${sub.id}`,
          type: 'info',
          title: 'Upcoming Renewal',
          message: `${sub.name} renews in ${daysUntilRenewal} days (${formattedAmount})`,
          date: today.toISOString(),
          read: false,
          subscriptionId: sub.id,
        })
      }
    }

    // Recent renewals (past 7 days)
    if (daysUntilRenewal < 0 && daysUntilRenewal >= -7) {
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
  }

  return sortNotifications(notifications)
}

async function readNotificationStates(
  supabase: any,
  userId: string,
  keys: string[]
) {
  const stateMap = new Map<string, NotificationStateRow>()

  if (!keys.length) return stateMap

  const { data, error } = await supabase
    .from('notification_state')
    .select('id, user_id, notification_key, is_read, dismissed, created_at, updated_at')
    .eq('user_id', userId)
    .in('notification_key', keys)

  if (error) throw error

  for (const row of data ?? []) {
    stateMap.set(row.notification_key, row as NotificationStateRow)
  }

  return stateMap
}

function applyNotificationState(
  notifications: Notification[],
  stateMap: Map<string, NotificationStateRow>
) {
  const hydrated = notifications
    .filter((notification) => !stateMap.get(notification.id)?.dismissed)
    .map((notification) => ({
      ...notification,
      read: stateMap.get(notification.id)?.is_read ?? notification.read,
    }))

  return sortNotifications(hydrated)
}

async function persistNotificationState(
  supabase: any,
  userId: string,
  action: NotificationAction,
  keys: string[]
) {
  const uniqueKeys = Array.from(new Set(keys.filter(Boolean)))
  if (!uniqueKeys.length) return

  const { data: existingRows, error: existingError } = await supabase
    .from('notification_state')
    .select('id, notification_key, is_read, dismissed')
    .eq('user_id', userId)
    .in('notification_key', uniqueKeys)

  if (existingError) throw existingError

  const existingMap = new Map(
    (existingRows ?? []).map((row: any) => [row.notification_key, row])
  )

  const inserts: Array<{
    user_id: string
    notification_key: string
    is_read: boolean
    dismissed: boolean
  }> = []

  const updates: Promise<any>[] = []

  for (const key of uniqueKeys) {
    const existing = existingMap.get(key)
    const nextIsRead = true
    const nextDismissed = action === 'dismiss' ? true : existing?.dismissed ?? false

    if (existing) {
      updates.push(
        supabase
          .from('notification_state')
          .update({
            is_read: nextIsRead,
            dismissed: nextDismissed,
          })
          .eq('id', existing.id)
      )
    } else {
      inserts.push({
        user_id: userId,
        notification_key: key,
        is_read: nextIsRead,
        dismissed: action === 'dismiss',
      })
    }
  }

  if (inserts.length) {
    const { error } = await supabase.from('notification_state').insert(inserts)
    if (error) throw error
  }

  if (updates.length) {
    const results = await Promise.all(updates)
    const failed = results.find((result: any) => result.error)
    if (failed?.error) throw failed.error
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // F8-lite: Fetch persistent notifications from DB first using new service
    let persistentNotifications: any[] = []
    try {
      persistentNotifications = await getUserNotifications(user.id, { limit: 50 })
    } catch (err) {
      console.warn('[v0] Failed to fetch persistent notifications:', err)
      // Continue with empty list, don't crash the endpoint
    }

    // Get user email for family invite lookup
    let userProfile: any = null
    try {
      const result = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()
      userProfile = result.data
    } catch (err) {
      console.warn('[v0] Failed to fetch user profile:', err)
    }

    // Use shared helper to fetch pending family invite (source-of-truth)
    // Fallback to auth email if profile email is missing
    let pendingInvite = null
    try {
      const userEmail = userProfile?.email || user.email || ''
      if (userEmail) {
        pendingInvite = await getPendingFamilyInviteForUserEmail(supabase, userEmail)
      }
    } catch (err) {
      console.warn('[v0] Failed to fetch pending family invite:', err)
    }

    // Convert helper result to buildNotifications format
    const familyInvites = pendingInvite
      ? [{
        id: pendingInvite.id,
        status: 'pending',
        created_at: pendingInvite.createdAt,
        family_group_id: pendingInvite.familyGroupId,
        family_owner: {
          email: pendingInvite.familyOwner.email,
        },
      }]
      : []

    let subscriptions: SubscriptionRow[] = []
    try {
      subscriptions = (await getUserSubscriptions()) as SubscriptionRow[]
    } catch (err) {
      console.warn('[v0] Failed to fetch subscriptions:', err)
    }

    const generatedNotifications = buildNotifications(subscriptions, familyInvites)
    let stateMap: Map<string, NotificationStateRow> = new Map()
    try {
      stateMap = await readNotificationStates(
        supabase,
        user.id,
        generatedNotifications.map((item) => item.id)
      )
    } catch (err) {
      console.warn('[v0] Failed to read notification states:', err)
    }

    const calculatedNotifications = applyNotificationState(generatedNotifications, stateMap)

    // F8-lite: Convert persistent notifications to API format and merge
    const persistentAsApiNotifications: Notification[] = persistentNotifications
      .filter(n => n.status !== 'archived')
      .map(n => ({
        id: n.id,
        type: n.type === 'family_invite' ? 'info' : 'reminder' as const,
        title: n.title,
        message: n.message,
        date: n.created_at,
        read: n.status === 'read',
        actionHref: n.action_url,
      }))

    // Merge persistent + calculated notifications, with persistent taking precedence
    const persistentIds = new Set(persistentAsApiNotifications.map(n => n.id))
    const mergedNotifications = [
      ...persistentAsApiNotifications,
      ...calculatedNotifications.filter(n => !persistentIds.has(n.id))
    ]

    return NextResponse.json({
      notifications: sortNotifications(mergedNotifications),
      unreadCount: mergedNotifications.filter((item) => !item.read).length,
    })
  } catch (error) {
    console.error('[v0] Notifications API error:', error)
    // F7.3R: Return safe empty response on any error instead of 500
    return NextResponse.json({
      notifications: [],
      unreadCount: 0,
    })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const action = body?.action as NotificationAction | undefined

    if (!action || !['mark_read', 'mark_all_read', 'dismiss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const ids = Array.isArray(body?.ids)
      ? body.ids.map(String)
      : body?.id
        ? [String(body.id)]
        : []

    if (!ids.length && action !== 'mark_all_read') {
      return NextResponse.json({ success: true })
    }

    // F8-lite: Try to handle persistent notifications first using new service
    if (action === 'mark_all_read') {
      try {
        await markAllNotificationsRead(user.id)
      } catch (e) {
        console.warn('[v0] Failed to mark persistent notifications as read:', e)
      }
      // Also handle legacy
      try {
        await legacyMarkAll(user.id)
      } catch (e) {
        console.warn('[v0] Failed to mark legacy notifications as read:', e)
      }
    } else if (ids.length > 0) {
      // Try persistent notifications
      for (const id of ids) {
        try {
          await markNotificationRead(id)
        } catch (e) {
          console.warn(`[v0] Failed to mark persistent notification ${id} as read:`, e)
        }
        // Also try legacy
        try {
          await legacyMark(id)
        } catch (e) {
          console.warn(`[v0] Failed to mark legacy notification ${id} as read:`, e)
        }
      }
    }

    // Also handle legacy notification_state for backward compatibility
    await persistNotificationState(supabase, user.id, action, ids)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Notifications update API error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
