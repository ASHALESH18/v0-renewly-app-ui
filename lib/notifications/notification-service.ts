// Combo 5: Notification service with idempotent creation
// Server-side only - handles persistent notification creation and management

import { createClient } from '@supabase/supabase-js'
import type { NotificationType, NotificationCategory } from './notification-types'

export interface CreateNotificationInput {
  userId: string
  type: NotificationType
  title: string
  message: string
  category?: NotificationCategory
  severity?: 'info' | 'warning' | 'critical'
  actionUrl?: string
  entityType?: string
  entityId?: string
  metadata?: Record<string, any>
  expiresAt?: Date
  idempotencyKey?: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string
  category: string
  severity: string
  action_url?: string
  entity_type?: string
  entity_id?: string
  idempotency_key?: string
  read_at?: string
  archived_at?: string
  expires_at?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

/**
 * Create a notification, guaranteed idempotent using idempotency_key
 * If the same key is used twice, the first notification is returned
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        category: input.category || 'system',
        severity: input.severity || 'info',
        action_url: input.actionUrl,
        entity_type: input.entityType,
        entity_id: input.entityId,
        idempotency_key: input.idempotencyKey,
        metadata: input.metadata || {},
        expires_at: input.expiresAt?.toISOString(),
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505' && input.idempotencyKey) {
        // Unique violation on idempotency_key - get existing
        console.log(`[notifications] Idempotent notification exists: ${input.idempotencyKey}`)
        return await getNotificationByIdempotencyKey(input.idempotencyKey)
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
 * Get a notification by idempotency key (for idempotency check)
 */
async function getNotificationByIdempotencyKey(key: string): Promise<Notification | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('idempotency_key', key)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null
      }
      console.error('[notifications] Failed to fetch by idempotency key:', error)
      return null
    }

    return data as Notification
  } catch (error) {
    console.error('[notifications] Unexpected error fetching by idempotency key:', error)
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
    category?: string
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
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.is('read_at', null)
    }

    if (options?.category) {
      query = query.eq('category', options.category)
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
      .is('read_at', null)
      .is('archived_at', null)

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
        read_at: new Date().toISOString(),
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
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .is('read_at', null)

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
        archived_at: new Date().toISOString(),
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
