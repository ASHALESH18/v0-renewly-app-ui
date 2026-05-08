import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { sendFamilyDowngradeScheduledEmail } from '@/lib/email/family-lifecycle-email'

/**
 * POST /api/family/lifecycle/schedule-downgrade
 * 
 * Family owner can schedule downgrade from Family to Pro at period end.
 * F8-lite: Simulation only, not real Razorpay recurring billing yet.
 * 
 * In QA, owner can call this to simulate scheduling.
 * In production, show contact path and block with 425 Too Early until Razorpay integration ready.
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
      .select('id, status, current_period_end, scheduled_action')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    if (fetchError || !familyGroup) {
      return NextResponse.json(
        { error: 'No active family group found' },
        { status: 404 }
      )
    }

    // F8-lite: Check if already scheduled for downgrade
    if (familyGroup.scheduled_action === 'downgrade_to_pro_at_period_end') {
      return NextResponse.json(
        {
          success: true,
          status: 'already_scheduled',
          scheduledFor: familyGroup.current_period_end,
          message: 'Family plan downgrade to Pro is already scheduled for the end of current billing period.',
        },
        { status: 200 }
      )
    }

    // Cannot downgrade if cancellation is already scheduled
    if (familyGroup.scheduled_action === 'cancel_at_period_end') {
      return NextResponse.json(
        {
          error: 'Cannot downgrade while cancellation is scheduled',
          message: 'Cancel the pending cancellation first if you want to downgrade to Pro instead.',
        },
        { status: 400 }
      )
    }

    // F8-lite: In production (not QA), block with 425
    if (process.env.VERCEL_ENV === 'production' && process.env.QA_PLAN_OVERRIDE_ENABLED !== 'true') {
      return NextResponse.json(
        {
          error: 'Feature not ready',
          message: 'Family plan management is being finalized. Please contact contact@renewly.in for assistance.',
          nextAction: 'contact_support',
        },
        { status: 425 }
      )
    }

    const now = new Date().toISOString()

    // Schedule downgrade at period end
    const { error: updateError } = await supabase
      .from('family_groups')
      .update({
        scheduled_action: 'downgrade_to_pro_at_period_end',
        scheduled_action_reason: 'owner_requested',
        scheduled_action_at: now,
        updated_at: now,
      })
      .eq('id', familyGroup.id)

    if (updateError) {
      console.error('[schedule-downgrade] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule downgrade' },
        { status: 500 }
      )
    }

    // F8-lite: extra-seat add-ons stop renewing with Family downgrade.
    const { error: addonCancelError } = await supabase
      .from('family_seat_addons')
      .update({
        cancel_at_period_end: true,
        updated_at: now,
      })
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')

    if (addonCancelError) {
      console.warn('[schedule-downgrade] Failed to schedule extra-seat add-ons to end:', addonCancelError)
    }

    // F9: Send downgrade scheduled notification (non-blocking)
    const ownerProfile = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (ownerProfile.data?.email) {
      sendFamilyDowngradeScheduledEmail({
        email: ownerProfile.data.email,
        scheduledDate: new Date(familyGroup.current_period_end || '').toLocaleDateString(),
      }).catch((err) => console.warn('[F9] Downgrade email hook failed:', err))
    }

    return NextResponse.json({
      success: true,
      status: 'scheduled',
      scheduledFor: familyGroup.current_period_end,
      message: `Family plan will downgrade to Pro on ${new Date(familyGroup.current_period_end || '').toLocaleDateString()}. Family members will lose access at that time.`,
    })
  } catch (error) {
    console.error('[schedule-downgrade] Error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
