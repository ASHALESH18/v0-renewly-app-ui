import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getUserSubscriptions } from '@/lib/supabase/repositories/subscriptions'
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

/**
 * Create a service-role Supabase client for server-side admin operations.
 * Used for reading/writing data that RLS prevents, scoped safely by user.id.
 * Never expose this client to the browser.
 */
function createAdminSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE credentials for admin operations')
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey)
}

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
    // S5B.4: Authenticate user with normal auth client
    const authSupabase = await createClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create admin Supabase client for server-only operations scoped by user.id
    let adminSupabase: any
    try {
      adminSupabase = createAdminSupabaseClient()
    } catch (error) {
      console.error('[notifications] Failed to initialize admin client:', error)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    }

    // Get user email for family invite lookup using admin client
    const { data: userProfile } = await adminSupabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    // Use shared helper with admin client to fetch pending family invite (source-of-truth)
    // Fallback to auth email if profile email is missing
    const userEmail = userProfile?.email || user.email || ''
    const normalizedEmail = userEmail.trim().toLowerCase()
    console.info('[notifications] user', { userId: user.id, email: normalizedEmail })

    const pendingInvite = userEmail
      ? await getPendingFamilyInviteForUserEmail(adminSupabase, userEmail)
      : null

    console.info('[notifications] pendingInvite', { found: Boolean(pendingInvite), inviteId: pendingInvite?.id })

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

    const subscriptions = (await getUserSubscriptions()) as SubscriptionRow[]
    const generatedNotifications = buildNotifications(subscriptions, familyInvites)

    // Read notification_state using admin client, scoped to user.id only
    const stateMap = await readNotificationStates(
      adminSupabase,
      user.id,
      generatedNotifications.map((item) => item.id)
    )

    const notifications = applyNotificationState(generatedNotifications, stateMap)
    const unreadCount = notifications.filter((item) => !item.read).length

    console.info('[notifications] generated', { count: generatedNotifications.length, unreadCount })

    return NextResponse.json(
      {
        notifications,
        unreadCount,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('[notifications] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // S5B.4: Authenticate user with normal auth client
    const authSupabase = await createClient()
    const {
      data: { user },
    } = await authSupabase.auth.getUser()

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

    if (!ids.length) {
      return NextResponse.json({ success: true })
    }

    // Create admin Supabase client for notification_state writes, scoped to user.id
    let adminSupabase: any
    try {
      adminSupabase = createAdminSupabaseClient()
    } catch (error) {
      console.error('[notifications] Failed to initialize admin client for POST:', error)
      return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    }

    // Persist notification state using admin client, scoped to user.id only
    await persistNotificationState(adminSupabase, user.id, action, ids)

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch (error) {
    console.error('[notifications] POST error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
