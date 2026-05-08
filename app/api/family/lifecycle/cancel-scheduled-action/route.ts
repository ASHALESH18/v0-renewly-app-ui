import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/family/lifecycle/cancel-scheduled-action
 * 
 * Family owner can cancel a previously scheduled cancellation or downgrade.
 * Allows owner to change their mind before the period end.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      { auth: { persistSession: false } }
    )

    // Fetch family group for this owner
    const { data: familyGroup, error: fetchError } = await supabase
      .from('family_groups')
      .select('id, status, scheduled_action')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    if (fetchError || !familyGroup) {
      return NextResponse.json(
        { error: 'No active family group found' },
        { status: 404 }
      )
    }

    // Check if there's anything scheduled to cancel
    if (!familyGroup.scheduled_action || familyGroup.scheduled_action === 'none') {
      return NextResponse.json(
        {
          error: 'Nothing scheduled',
          message: 'No cancellation or downgrade is currently scheduled.',
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const wasScheduled = familyGroup.scheduled_action

    // Clear the scheduled action
    const { error: updateError } = await supabase
      .from('family_groups')
      .update({
        scheduled_action: 'none',
        scheduled_action_reason: null,
        scheduled_action_at: null,
        updated_at: now,
      })
      .eq('id', familyGroup.id)

    if (updateError) {
      console.error('[cancel-scheduled-action] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel scheduled action' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      status: 'cancelled',
      wasPreviouslyScheduled: wasScheduled,
      message: `${wasScheduled === 'cancel_at_period_end' ? 'Cancellation' : 'Downgrade'} has been cancelled. Your Family plan will continue normally.`,
    })
  } catch (error) {
    console.error('[cancel-scheduled-action] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
