import { createClient } from '@supabase/supabase-js'

export interface Notification {
  id: string
  user_id: string
  type: 'family_invite' | 'family_member_joined' | 'family_member_left' | 'subscription_reminder' | 'payment_issue'
  source: 'family_invite' | 'subscription' | 'billing' | 'system'
  source_id: string
  title: string
  message: string
  action_url?: string
  action_label?: string
  status: 'unread' | 'read' | 'archived'
  metadata?: Record<string, any>
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

  const { data, error } = await supabase
    .from('notifications')
    .upsert(
      {
        user_id: userId,
        ...notification,
      },
      { onConflict: 'user_id,source,source_id' }
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
    status?: 'unread' | 'read' | 'archived'
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
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

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

export async function markNotificationRead(notificationId: string): Promise<Notification> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'read', updated_at: new Date().toISOString() })
    .eq('id', notificationId)
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

  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'read', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('status', 'unread')

  if (error) throw error
  return data?.length || 0
}

export async function archiveNotification(notificationId: string): Promise<Notification> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', notificationId)
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

  const { data, error } = await supabase
    .from('notifications')
    .update({ status: 'archived' })
    .eq('user_id', userId)
    .lt('expires_at', new Date().toISOString())

  if (error) throw error
  return data?.length || 0
}
