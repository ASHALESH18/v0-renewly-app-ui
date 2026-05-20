// Combo 5: Notification service with idempotent creation
// Server-side only - handles persistent notification creation and management
// Uses source/source_id for idempotency (UNIQUE constraint on table)

import { createClient } from '@supabase/supabase-js'

export interface CreateNotificationInput {
  userId: string
  type: 'family_invite' | 'family_member_joined' | 'family_member_left' | 'subscription_reminder' | 'payment_issue'
  title: string
  message: string
  actionUrl?: string
  actionLabel?: string
  source: 'family_invite' | 'subscription' | 'billing' | 'system'
  sourceId: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  action_url?: string
  action_label?: string
  source: string
  source_id: string
  status: 'unread' | 'read' | 'archived'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  expires_at?: string
}

/**
 * Create a notification, guaranteed idempotent using source/source_id
 * If the same source/source_id pair already exists, return the existing notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    // Try to insert - will fail with unique constraint if exists
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        action_url: input.actionUrl,
        action_label: input.actionLabel,
        source: input.source,
        source_id: input.sourceId,
        status: 'unread',
        metadata: input.metadata || {},
        expires_at: input.expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation - notification already exists
        // Fetch the existing one
        console.log(`[notifications] Idempotent notification exists: ${input.source}:${input.sourceId}`)
        return await getNotificationBySource(input.userId, input.source, input.sourceId)
      }
      console.error('[notifications] Failed to create notification:', error)
      return null
    }

    return data as Notification
  } catch (error) {
    console.error('[notifications] Unexpected error creating notification:', error)
    return null
  }
}

/**
 * Get a notification by source/source_id (for idempotency check)
 */
async function getNotificationBySource(
  userId: string,
  source: string,
  sourceId: string
): Promise<Notification | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('source', source)
      .eq('source_id', sourceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('[notifications] Failed to fetch by source:', error)
      return null
    }

    return data as Notification
  } catch (error) {
    console.error('[notifications] Unexpected error fetching by source:', error)
    return null
  }
}
/**
 * Get user's notifications with optional filtering
 */
export async function getUserNotifications(
  userId: string,
  options?: {
    limit?: number
    unreadOnly?: boolean
  }
): Promise<Notification[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.eq('status', 'unread')
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      console.error('[notifications] Failed to fetch user notifications:', error)
      return []
    }

    return (data || []) as Notification[]
  } catch (error) {
    console.error('[notifications] Unexpected error fetching notifications:', error)
    return []
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'unread')

    if (error) {
      console.error('[notifications] Failed to get unread count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[notifications] Unexpected error getting unread count:', error)
    return 0
  }
}

/**
 * Mark a single notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      console.error('[notifications] Failed to mark notification read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[notifications] Unexpected error marking notification read:', error)
    return false
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'read',
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('status', 'unread')

    if (error) {
      console.error('[notifications] Failed to mark all notifications read:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[notifications] Unexpected error marking all notifications read:', error)
    return false
  }
}

/**
 * Archive a notification
 */
export async function archiveNotification(notificationId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)

    if (error) {
      console.error('[notifications] Failed to archive notification:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('[notifications] Unexpected error archiving notification:', error)
    return false
  }
}
