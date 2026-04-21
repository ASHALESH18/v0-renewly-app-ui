import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEvent, isInngestAvailable } from '@/lib/inngest/client'
import { invalidateUserCaches } from '@/lib/redis'

/**
 * POST /api/smart-capture/notification-lab
 * Submit a test notification to the processing pipeline
 * 
 * Works even if Inngest is not configured - still creates the ingestion event
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      appName,
      title,
      body: notificationBody,
    } = body

    // Validate required fields
    if (!appName || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: appName, title, body' },
        { status: 400 }
      )
    }

    // Create ingestion event in the database
    const { data: ingestionEvent, error: createError } = await supabase
      .from('ingestion_events')
      .insert({
        user_id: user.id,
        source_type: 'notification',
        source_provider: 'notification_lab',
        raw_content: { appName, title, body: notificationBody },
        metadata: { receivedAt: new Date().toISOString() },
        status: 'queued',
      })
      .select()
      .single()

    if (createError) {
      console.error('[notification-lab] Error creating event:', createError)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    // Try to send to Inngest if available, but don't fail if not
    const inngestAvailable = isInngestAvailable()
    let inngestResult = null
    
    if (inngestAvailable) {
      try {
        inngestResult = await sendEvent({
          name: 'smart-capture/notification.received',
          data: {
            userId: user.id,
            title,
            body: notificationBody,
            appName,
            receivedAt: new Date().toISOString(),
            source: 'notification_lab',
          },
        })
        console.log('[notification-lab] Event sent to Inngest:', inngestResult)
      } catch (inngestError) {
        console.warn('[notification-lab] Inngest send failed:', inngestError)
        // Continue anyway - the event was created in the database
      }
    } else {
      console.log('[notification-lab] Inngest not available, event will be stored for manual processing')
    }

    // Invalidate caches
    await invalidateUserCaches(user.id)

    return NextResponse.json({
      event: ingestionEvent,
      status: 'queued',
      message: 'Notification queued for processing',
      inngestQueued: inngestAvailable && inngestResult?.ok,
      inngestConfigured: inngestAvailable,
    }, { status: 202 })
  } catch (error) {
    console.error('[notification-lab] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/smart-capture/notification-lab
 * Fetch recent notification lab ingestion events
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10)

    // Query ingestion_events from notification_lab source
    const { data: events, error } = await supabase
      .from('ingestion_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_provider', 'notification_lab')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[notification-lab] Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events: events || [] })
  } catch (error) {
    console.error('[notification-lab] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
