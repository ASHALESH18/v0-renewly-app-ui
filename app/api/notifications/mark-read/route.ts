// Combo 5: POST /api/notifications/mark-read
// Mark notifications as read

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/notification-service'

interface MarkReadRequest {
  notificationId?: string
  all?: boolean
}

export async function POST(request: NextRequest) {
  try {
    // Get auth user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || '',
      {
        auth: {
          persistSession: false,
        },
      }
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(
      request.headers.get('authorization')?.replace('Bearer ', '') || ''
    )

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: MarkReadRequest = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is OK
    }

    // Handle mark all read
    if (body.all) {
      const success = await markAllNotificationsRead(user.id)
      return NextResponse.json({
        success,
        message: success ? 'All notifications marked read' : 'Failed to mark all as read',
      })
    }

    // Handle mark single read
    if (!body.notificationId) {
      return NextResponse.json(
        { success: false, error: 'notificationId or all required' },
        { status: 400 }
      )
    }

    const success = await markNotificationRead(body.notificationId, user.id)
    return NextResponse.json({
      success,
      message: success ? 'Notification marked read' : 'Failed to mark as read',
    })
  } catch (error) {
    console.error('[api/notifications/mark-read] Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'mark_read_failed' },
      { status: 500 }
    )
  }
}
