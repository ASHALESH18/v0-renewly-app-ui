// Combo 5D: Notification service with idempotent creation
// Server-side only - handles persistent notification creation and management
// Uses idempotency_key for deduplication (UNIQUE PARTIAL index on table)

import { createClient } from '@supabase/supabase-js'

export interface CreateNotificationInput {
  userId: string
  type: string
  title: string
  message: string
  category?: string
  severity?: 'info' | 'warning' | 'critical'
  actionUrl?: string
  actionLabel?: string
  entityType?: string
  entityId?: string
  idempotencyKey?: string
  metadata?: Record<string, any>
  expiresAt?: Date
}

export interface Notification {
  id: string
  user_id: string
  type: string
  category: string
  severity: string
  title: string
  message: string
  action_url?: string
  action_label?: string
  entity_type?: string
  entity_id?: string
  idempotency_key?: string
  metadata: Record<string, any>
  read_at?: string
  archived_at?: string
  created_at: string
  updated_at: string
  expires_at?: string
}

/**
 * Create a notification, guaranteed idempotent using idempotency_key
 * If the same idempotency_key already exists, return the existing notification
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; notificationId?: string; notification?: Notification; error?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    // If idempotency_key provided, check if notification already exists
    if (input.idempotencyKey) {
      const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('*')
        .eq('idempotency_key', input.idempotencyKey)
        .single()

      if (!checkError && existing) {
        // Notification already exists, return it
        console.debug(`[notifications] Idempotent notification exists: ${input.idempotencyKey}`)
        return {
          success: true,
          notificationId: existing.id,
          notification: existing as Notification,
        }
      }
    }

    // Try to insert new notification
    const insertData: Record<string, any> = {
      user_id: input.userId,
      type: input.type,
      category: input.category || 'system',
      severity: input.severity || 'info',
      title: input.title,
      message: input.message,
      action_url: input.actionUrl,
      entity_type: input.entityType,
      entity_id: input.entityId,
      idempotency_key: input.idempotencyKey,
      expires_at: input.expiresAt?.toISOString(),
    }

    // Store actionLabel in metadata if provided
    const metadata = input.metadata || {}
    if (input.actionLabel) {
      metadata.action_label = input.actionLabel
    }
    insertData.metadata = metadata

    const { data, error } = await supabase
      .from('notifications')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      if (error.code === '23505' && input.idempotencyKey) {
        // Unique constraint violation on idempotency_key - fetch the existing one
        const { data: existing } = await supabase
          .from('notifications')
          .select('*')
          .eq('idempotency_key', input.idempotencyKey)
          .single()

        if (existing) {
          console.debug(`[notifications] Retrieved existing notification: ${input.idempotencyKey}`)
          return {
            success: true,
            notificationId: existing.id,
            notification: existing as Notification,
          }
        }
      }

      // Table might not exist yet - table creation is safe to defer
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.debug('[notifications] Notifications table may not exist yet. Notification creation deferred. Run migrations to enable persistence.')
        return {
          success: false,
          error: 'Table not ready',
        }
      }

      console.error('[notifications] Failed to create notification:', error)
      return {
        success: false,
        error: error.message || 'Failed to create notification',
      }
    }

    return {
      success: true,
      notificationId: data.id,
      notification: data as Notification,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unexpected error'
    console.error('[notifications] Unexpected error creating notification:', error)
    return {
      success: false,
      error: errorMsg,
    }
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
      .is('archived_at', null)
      .order('created_at', { ascending: false })

    if (options?.unreadOnly) {
      query = query.is('read_at', null)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) {
      // Table might not exist yet, return empty gracefully
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.debug('[notifications] Table may not exist yet, returning empty list:', error.message)
        return []
      }
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
export async function markNotificationRead(notificationId: string, userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

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
export async function archiveNotification(notificationId: string, userId: string): Promise<boolean> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )

  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        archived_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

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
