import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import { invalidateUserCaches } from '@/lib/redis'

/**
 * POST /api/smart-capture/notification-lab
 * Submit a test notification to the processing pipeline via Inngest
 * 
 * This endpoint is used by the Notification Lab for testing
 * subscription detection with simulated notifications.
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

    // Send to Inngest for async processing
    await inngest.send({
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

    // Invalidate caches
    await invalidateUserCaches(user.id)

    return NextResponse.json({
      event: ingestionEvent,
      status: 'queued',
      message: 'Notification queued for processing',
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

// Helper: Extract provider name from notification text
function extractProviderFromText(appName: string, title: string, body: string): string {
  const combinedText = `${appName} ${title} ${body}`.toLowerCase()
  
  // Common subscription services
  const providers = [
    'netflix', 'spotify', 'amazon prime', 'youtube premium', 'disney+',
    'hotstar', 'apple music', 'google one', 'icloud', 'microsoft 365',
    'adobe', 'dropbox', 'notion', 'slack', 'zoom', 'canva'
  ]

  for (const provider of providers) {
    if (combinedText.includes(provider)) {
      return provider.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }
  }

  // Fall back to app name
  return appName
}

// Helper: Extract amount from text
function extractAmountFromText(text: string): number | null {
  // Match patterns like "Rs 649", "$9.99", "€12.50", "Rs. 119"
  const patterns = [
    /(?:Rs\.?|INR|₹)\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/i,
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /€\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)/,
    /(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:rupees?|dollars?|euros?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''))
      if (!isNaN(amount)) return amount
    }
  }

  return null
}

// Helper: Calculate confidence score
function calculateConfidence(provider: string, amount: number | null): number {
  let score = 30 // Base score

  // Known provider boost
  const knownProviders = ['netflix', 'spotify', 'amazon', 'youtube', 'disney', 'apple', 'google', 'microsoft']
  if (knownProviders.some(p => provider.toLowerCase().includes(p))) {
    score += 40
  }

  // Amount detected boost
  if (amount && amount > 0) {
    score += 25
  }

  return Math.min(score, 95)
}
