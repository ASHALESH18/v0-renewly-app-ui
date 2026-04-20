import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/smart-capture/notification-lab
 * Submit a test notification to the processing pipeline
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
      amount,
      currency,
      merchant,
    } = body

    // Validate required fields
    if (!appName || !title || !notificationBody) {
      return NextResponse.json(
        { error: 'Missing required fields: appName, title, body' },
        { status: 400 }
      )
    }

    // Create notification lab event
    const eventData = {
      user_id: user.id,
      app_name: appName,
      title,
      body: notificationBody,
      timestamp: new Date().toISOString(),
      amount: amount || null,
      currency: currency || 'INR',
      merchant: merchant || null,
      status: 'queued',
      created_at: new Date().toISOString(),
    }

    const { data: event, error: createError } = await supabase
      .from('notification_lab_events')
      .insert(eventData)
      .select()
      .single()

    if (createError) {
      console.error('[notification-lab] Error creating event:', createError)
      return NextResponse.json(
        { error: 'Failed to create event' },
        { status: 500 }
      )
    }

    // Queue for processing (in production, this would go to Redis/queue)
    // For now, we'll do inline processing simulation
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Simple pattern matching for demonstration
    const providerName = merchant || extractProviderFromText(appName, title, notificationBody)
    const detectedAmount = amount || extractAmountFromText(notificationBody)
    
    // Create candidate from notification
    const candidateData = {
      user_id: user.id,
      source: 'notification_lab',
      ingestion_event_id: event.id,
      provider_name: providerName,
      amount: detectedAmount,
      currency: currency || 'INR',
      billing_cycle: 'unknown',
      confidence_score: calculateConfidence(providerName, detectedAmount),
      confidence_level: detectedAmount ? 'medium' : 'low',
      status: 'new',
      evidence_snippet: `${title}: ${notificationBody}`,
      evidence_details: [
        { type: 'notification', label: 'App', value: appName, confidence: 100 },
        { type: 'body', label: 'Title', value: title, confidence: 90 },
      ],
      tags: [],
      detected_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: candidate, error: candidateError } = await supabase
      .from('subscription_candidates')
      .insert(candidateData)
      .select()
      .single()

    // Update event status
    await supabase
      .from('notification_lab_events')
      .update({
        status: candidateError ? 'failed' : 'candidate_created',
        candidate_id: candidate?.id || null,
        error_message: candidateError?.message || null,
      })
      .eq('id', event.id)

    if (candidateError) {
      console.error('[notification-lab] Error creating candidate:', candidateError)
      return NextResponse.json({
        event,
        status: 'failed',
        error: 'Failed to create candidate',
      })
    }

    return NextResponse.json({
      event,
      candidate,
      status: 'candidate_created',
    }, { status: 201 })
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
 * Fetch recent notification lab events
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

    const { data: events, error } = await supabase
      .from('notification_lab_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[notification-lab] Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events })
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
