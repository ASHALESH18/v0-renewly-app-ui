import { createClient } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type: 'family_invite' | 'family_member_joined' | 'family_member_left' | 'subscription_reminder' | 'payment_issue'
  category?: string
  severity?: string
  title: string
  message: string
  action_url?: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, any>
  read_at?: string
  archived_at?: string
  created_at: string
  expires_at?: string
  updated_at: string
}

export async function createNotification(
  userId: string,
  notification: Omit<Notification, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Notification> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Map old fields to actual schema columns
  const metadata = notification.metadata || {}
  const idempotencyKey = metadata.source_id ? `${metadata.source}:${metadata.source_id}` : undefined

  const { data, error } = await supabase
    .from('notifications')
    .insert(
      {
        user_id: userId,
        type: notification.type,
        category: notification.category || 'system',
        severity: notification.severity || 'info',
        title: notification.title,
        message: notification.message,
        action_url: notification.action_url,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
        idempotency_key: idempotencyKey,
        metadata: metadata,
        expires_at: notification.expires_at,
      }
    )
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    offset?: number
  }
): Promise<Notification[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

export async function markNotificationRead(notificationId: string, userId: string): Promise<Notification> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markAllNotificationsRead(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error, count } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)
    .select('id', { count: 'exact' })

  if (error) throw error
  return count || 0
}

export async function archiveNotification(notificationId: string, userId: string): Promise<Notification> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('notifications')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function cleanupExpiredNotifications(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error, count } = await supabase
    .from('notifications')
    .update({ archived_at: new Date().toISOString() })
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString())
    .is('archived_at', null)
    .select('id', { count: 'exact' })

  if (error) throw error
  return count || 0
}
