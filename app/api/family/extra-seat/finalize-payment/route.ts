import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  normalizeInviteEmail,
  generateInviteToken,
  hashInviteToken,
  buildFamilyInviteUrl,
  getInviteBaseUrl,
  getInviteExpiryDate,
} from '@/lib/family/family-invite-utils'
import { sendFamilyInviteEmail } from '@/lib/email/family-invite-email'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'

/**
 * POST /api/family/extra-seat/finalize-payment
 *
 * F6C: Create and send extra-seat invite after payment success.
 *
 * Body: { intentId: "<uuid>" }
 *
 * Only processes intents with status: qa_confirmed or paid
 * Idempotent: if invite already exists for this intent, returns existing invite
 * Only creates ONE invite per intent
 *
 * Returns:
 * - { success: true, inviteId, emailSent } if invite created/exists
 * - { error, status } if validation/creation fails
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[finalize-payment] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Authenticate user
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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
        { error: 'Only Family owners can finalize payments' },
        { status: 403 }
      )
    }

    // Fetch payment intent
    const { data: intent } = await supabase
      .from('family_extra_seat_payment_intents')
      .select('id, family_group_id, owner_user_id, invited_email, status, paid_at, qa_confirmed_at, expires_at')
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
        { error: 'Cannot finalize another user\'s intent' },
        { status: 403 }
      )
    }

    // Check: intent is in finalized state (qa_confirmed or paid)
    if (intent.status !== 'qa_confirmed' && intent.status !== 'paid') {
      return NextResponse.json(
        { error: `Cannot finalize intent in status: ${intent.status}` },
        { status: 409 }
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

    // Idempotency: check if invite already exists for this intent (metadata.payment_intent_id)
    const { data: existingInvite } = await supabase
      .from('family_invites')
      .select('id, invited_email, status')
      .eq('family_group_id', intent.family_group_id)
      .ilike('invited_email', intent.invited_email)
      .eq('seat_type', 'extra')
      .in('status', ['pending', 'accepted'])
      .single()

    if (existingInvite) {
      return NextResponse.json({
        success: true,
        inviteId: existingInvite.id,
        emailSent: false,
        note: 'Invite already exists for this email (idempotent)',
      })
    }

    // Fetch family group
    const { data: familyGroup } = await supabase
      .from('family_groups')
      .select('id, status')
      .eq('id', intent.family_group_id)
      .single()

    if (!familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found' },
        { status: 404 }
      )
    }

    // Duplicate check: ensure email is not already a member (safety check)
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .ilike('email', intent.invited_email)
      .eq('status', 'active')
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the family group' },
        { status: 409 }
      )
    }

    // Generate secure token for extra-seat invite
    const rawToken = generateInviteToken()
    const tokenHash = hashInviteToken(rawToken)
    const expiryDate = getInviteExpiryDate()

    // Create extra-seat invite (without metadata - use idempotency by email+family+seat_type instead)
    const { data: newInvite, error: insertError } = await supabase
      .from('family_invites')
      .insert({
        family_group_id: familyGroup.id,
        invited_email: intent.invited_email,
        invited_by: user.id,
        token_hash: tokenHash,
        status: 'pending',
        seat_type: 'extra',
        expires_at: expiryDate.toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !newInvite) {
      console.error('[finalize-payment] Invite insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Record paid extra seat capacity (F6C: After successful payment, record the seat)
    // Check if we need to create or update family_seat_addons
    const { data: existingAddons } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')
      .limit(1)

    const nowIso = now.toISOString()
    const periodStart = nowIso
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now

    if (!existingAddons || existingAddons.length === 0) {
      // Create new family_seat_addons record with quantity 1
      const { error: addonCreateError } = await supabase
        .from('family_seat_addons')
        .insert({
          family_group_id: familyGroup.id,
          quantity: 1,
          price_inr_per_seat: 99,
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: false,
        })

      if (addonCreateError) {
        console.warn('[finalize-payment] Failed to create seat addon:', addonCreateError)
        // Don't fail - invite was created successfully, addon tracking is secondary
      } else {
        // Update family_groups.extra_seat_count to 1
        await supabase
          .from('family_groups')
          .update({
            extra_seat_count: 1,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: nowIso,
          })
          .eq('id', familyGroup.id)
          .catch(err => console.warn('[finalize-payment] Failed to update extra_seat_count:', err))
      }
    } else {
      // Increment existing addon quantity if still in period
      const addon = existingAddons[0]
      const newQuantity = (addon.quantity || 0) + 1

      const { error: addonUpdateError } = await supabase
        .from('family_seat_addons')
        .update({
          quantity: newQuantity,
          current_period_end: periodEnd,
          cancel_at_period_end: false, // Clear cancel flag if reusing
          updated_at: nowIso,
        })
        .eq('id', addon.id)

      if (addonUpdateError) {
        console.warn('[finalize-payment] Failed to update seat addon:', addonUpdateError)
      } else {
        // Update family_groups.extra_seat_count
        await supabase
          .from('family_groups')
          .update({
            extra_seat_count: newQuantity,
            current_period_end: periodEnd,
            updated_at: nowIso,
          })
          .eq('id', familyGroup.id)
          .catch(err => console.warn('[finalize-payment] Failed to update extra_seat_count:', err))
      }
    }

    // Fetch owner profile for email
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    // Build invite URL
    const requestOrigin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      undefined

    const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

    if (process.env.VERCEL_ENV !== 'production') {
      console.info('[finalize-payment] Extra-seat invite created', {
        invitedEmail: intent.invited_email,
        inviteId: newInvite.id,
        seatType: 'extra',
      })
    }

    // Send invite email
    const emailResult = await sendFamilyInviteEmail({
      invitedEmail: intent.invited_email,
      ownerEmail: ownerProfile?.email || user.email || '',
      ownerName: ownerProfile?.email || 'Family member',
      inviteUrl,
      expiresInDays: 7,
    })

    // Mark intent as processed (update paid_at if not already set)
    if (intent.status === 'paid' && !intent.paid_at) {
      await supabase
        .from('family_extra_seat_payment_intents')
        .update({
          paid_at: now.toISOString(),
        })
        .eq('id', intentId)
    }

    return NextResponse.json({
      success: true,
      inviteId: newInvite.id,
      emailSent: emailResult.sent,
      message: `Extra-seat invite created for ${intent.invited_email}`,
    })
  } catch (error) {
    console.error('[finalize-payment] Error:', error)
    return NextResponse.json(
      { error: 'Failed to finalize payment' },
      { status: 500 }
    )
  }
}
