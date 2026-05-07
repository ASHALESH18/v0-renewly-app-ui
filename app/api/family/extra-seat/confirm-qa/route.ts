import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'

/**
 * POST /api/family/extra-seat/confirm-qa
 *
 * Preview/QA only endpoint to simulate payment success for extra-seat intents.
 * Marks a pending intent as qa_confirmed so the next batch F6C can create the invite.
 *
 * Body: { intentId: "<uuid>" }
 *
 * Blocked in production.
 * Blocked if QA_PLAN_OVERRIDE_ENABLED !== 'true'
 * Blocked for non-allowlisted QA users.
 */
export async function POST(request: NextRequest) {
  try {
    // Block in production
    if (process.env.VERCEL_ENV === 'production') {
      return NextResponse.json(
        { error: 'QA confirm not available in production' },
        { status: 403 }
      )
    }

    // Check: QA override enabled
    const qaEnabled = process.env.QA_PLAN_OVERRIDE_ENABLED === 'true'
    if (!qaEnabled) {
      return NextResponse.json(
        { error: 'QA plan override is not enabled' },
        { status: 403 }
      )
    }

    // Check: user is in QA allowlist
    const qaEmailsEnv = process.env.QA_PLAN_OVERRIDE_EMAILS || ''
    const qaAllowlist = qaEmailsEnv.split(',').map((e) => e.trim().toLowerCase())

    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[confirm-qa] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user profile for email check
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (!profile || !qaAllowlist.includes(profile.email.toLowerCase())) {
      return NextResponse.json(
        { error: 'User not in QA allowlist' },
        { status: 403 }
      )
    }

    // Parse request
    const body = await request.json()
    const intentId = body.intentId as string

    if (!intentId) {
      return NextResponse.json(
        { error: 'intentId is required' },
        { status: 400 }
      )
    }

    // Check: user is Family owner
    const entitlement = await resolveEffectiveEntitlement(user.id)
    if (!entitlement.isFamilyOwner) {
      return NextResponse.json(
        { error: 'Only Family owners can confirm payment intents' },
        { status: 403 }
      )
    }

    // Fetch intent
    const { data: intent } = await supabase
      .from('family_extra_seat_payment_intents')
      .select('id, owner_user_id, status, expires_at')
      .eq('id', intentId)
      .single()

    if (!intent) {
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      )
    }

    // Check: owner_user_id matches signed-in user
    if (intent.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Cannot confirm another user\'s intent' },
        { status: 403 }
      )
    }

    // Check: intent is not expired
    const now = new Date()
    if (new Date(intent.expires_at) < now) {
      return NextResponse.json(
        { error: 'Payment intent has expired' },
        { status: 410 }
      )
    }

    // Check: intent is pending
    if (intent.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot confirm intent in status: ${intent.status}` },
        { status: 409 }
      )
    }

    // Update intent to qa_confirmed
    const now2 = new Date()
    const { error: updateError } = await supabase
      .from('family_extra_seat_payment_intents')
      .update({
        status: 'qa_confirmed',
        qa_confirmed_at: now2.toISOString(),
        updated_at: now2.toISOString(),
        metadata: {
          qa_payment_simulated: true,
        },
      })
      .eq('id', intentId)

    if (updateError) {
      console.error('[confirm-qa] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      intentId,
      status: 'qa_confirmed',
      nextAction: 'create_extra_seat_invite',
      message: 'Payment confirmed in QA. The next step will send the extra-seat invite.',
    })
  } catch (error) {
    console.error('[confirm-qa] Error:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
