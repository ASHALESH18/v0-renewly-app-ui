import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/notifications/browser-push-preference
 * 
 * Safe server-side endpoint for updating browser push notification preferences
 * and marking the onboarding prompt as seen
 * 
 * Body:
 * {
 *   "pushNotifications": boolean,
 *   "markPromptSeen": boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[browser-push-preference] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { pushNotifications, markPromptSeen } = await request.json()

    if (typeof pushNotifications !== 'boolean' || typeof markPromptSeen !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      push_notifications: pushNotifications,
      updated_at: new Date().toISOString(),
    }

    // Only update push_prompt_seen_at if markPromptSeen is true
    if (markPromptSeen) {
      updatePayload.push_prompt_seen_at = new Date().toISOString()
    }

    // Update user settings
    const { data, error } = await supabase
      .from('user_settings')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[v0] Failed to update push preference:', error)
      return NextResponse.json(
        { error: 'Failed to update preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pushNotifications: data.push_notifications,
      pushPromptSeenAt: data.push_prompt_seen_at,
    })
  } catch (err) {
    console.error('[v0] Browser push preference API error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
