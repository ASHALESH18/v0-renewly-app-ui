'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeInviteEmail } from '@/lib/family/family-invite-utils'
import { FAMILY_INCLUDED_MEMBER_COUNT, FAMILY_EXTRA_MEMBER_PRICE_INR } from '@/lib/family/family-config'
import { calculateSeatUsage, areIncludedSeatsFull } from '@/lib/family/family-seat-utils'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'

/**
 * POST /api/family/extra-seat/intent
 *
 * Owner creates an extra-seat intent for a member beyond the 4 included seats
 * Body: { email: "member@example.com" }
 *
 * This is a pre-payment intent only. Does not create invite or payment yet.
 * F6B will create the Razorpay order.
 * F6C will create the actual invite after payment succeeds.
 *
 * Returns:
 * - { success: true, intent: {...} } if included seats are full
 * - { error, status: 400 } if included seats are still available
 * - { error, status: 403 } if user is not Family owner
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[extra-seat-intent] Missing Supabase env vars')
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
    const rawEmail = body.email as string

    if (!rawEmail) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Normalize and validate email
    let invitedEmail: string
    try {
      invitedEmail = normalizeInviteEmail(rawEmail)
    } catch (error) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: 400 }
      )
    }

    // Check: user must be Family owner
    const entitlement = await resolveEffectiveEntitlement(user.id)
    if (!entitlement.isFamilyOwner) {
      return NextResponse.json(
        { error: 'Only the Family owner can add extra seats' },
        { status: 403 }
      )
    }

    // Check: owner cannot invite self
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    if (ownerProfile && normalizeInviteEmail(ownerProfile.email) === invitedEmail) {
      return NextResponse.json(
        { error: 'Cannot invite yourself' },
        { status: 400 }
      )
    }

    // Fetch owner's family group
    const { data: familyGroup } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, extra_seat_count')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    if (!familyGroup) {
      return NextResponse.json(
        { error: 'No active family group found' },
        { status: 403 }
      )
    }

    // Check: duplicate pending invite
    const { data: existingPending } = await supabase
      .from('family_invites')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .ilike('invited_email', invitedEmail)
      .eq('status', 'pending')
      .single()

    if (existingPending) {
      return NextResponse.json(
        { error: 'Invite already sent to this email' },
        { status: 409 }
      )
    }

    // Check: no active member with same email
    const { data: existingMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .ilike('email', invitedEmail)
      .eq('status', 'active')
      .single()

    if (existingMember) {
      return NextResponse.json(
        { error: 'This email is already a member of the family group' },
        { status: 409 }
      )
    }

    // Fetch seat usage
    const { data: activeMembers } = await supabase
      .from('family_members')
      .select('id, role, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')

    const { data: pendingInvites } = await supabase
      .from('family_invites')
      .select('id, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'pending')

    const seatUsage = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup,
    })

    // Verify included seats are actually full
    if (!areIncludedSeatsFull(seatUsage)) {
      return NextResponse.json(
        { error: 'Included seats are still available. Send a normal invite instead.' },
        { status: 400 }
      )
    }

    // Check: reuse existing pending unexpired intent for same owner + family + email
    const now = new Date()
    const { data: existingIntent } = await supabase
      .from('family_extra_seat_payment_intents')
      .select('id, status, expires_at, created_at')
      .eq('owner_user_id', user.id)
      .eq('family_group_id', familyGroup.id)
      .ilike('invited_email', invitedEmail)
      .eq('status', 'pending')
      .gt('expires_at', now.toISOString())
      .single()

    let intentId: string
    let intentExpiresAt: string

    if (existingIntent) {
      // Reuse existing intent
      intentId = existingIntent.id
      intentExpiresAt = existingIntent.expires_at
    } else {
      // Create new pending intent
      const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      const { data: newIntent, error: insertError } = await supabase
        .from('family_extra_seat_payment_intents')
        .insert({
          family_group_id: familyGroup.id,
          owner_user_id: user.id,
          invited_email: invitedEmail,
          amount_inr: FAMILY_EXTRA_MEMBER_PRICE_INR,
          currency: 'INR',
          status: 'pending',
          source: 'family_extra_seat',
          metadata: {},
          expires_at: newExpiresAt.toISOString(),
        })
        .select('id, expires_at')
        .single()

      if (insertError || !newIntent) {
        console.error('[extra-seat-intent] Insert error:', insertError)
        return NextResponse.json(
          { error: 'Failed to create payment intent' },
          { status: 500 }
        )
      }

      intentId = newIntent.id
      intentExpiresAt = newIntent.expires_at
    }

    // F6B-production: TODO - Create Razorpay order/subscription for ₹99/member/month
    // TODO: Store razorpay_order_id in metadata
    // TODO: Verify payment server-side
    // TODO: Mark intent paid only after Razorpay verification

    // F6C: TODO - Create family_invite with seat_type = extra only after intent status is paid or qa_confirmed
    // TODO: Send invite email after payment success

    // Determine if QA is enabled
    const isQaEnabled = process.env.QA_PLAN_OVERRIDE_ENABLED === 'true'

    return NextResponse.json({
      success: true,
      intent: {
        id: intentId,
        email: invitedEmail,
        extraSeatRequired: true,
        priceINR: FAMILY_EXTRA_MEMBER_PRICE_INR,
        currency: 'INR',
        billingCycle: 'monthly',
        status: 'pending',
        expiresAt: intentExpiresAt,
        previewQaEnabled: isQaEnabled,
        copy: `Adding this member requires an extra seat at ₹${FAMILY_EXTRA_MEMBER_PRICE_INR}/month.`,
      },
    })
  } catch (error) {
    console.error('[extra-seat-intent] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create extra-seat intent' },
      { status: 500 }
    )
  }
}
