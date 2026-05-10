'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  normalizeInviteEmail,
  generateInviteToken,
  hashInviteToken,
  buildFamilyInviteUrl,
  getInviteExpiryDate,
} from '@/lib/family/family-invite-utils'
import { sendFamilyInviteEmail } from '@/lib/email/family-invite-email'
import {
  FAMILY_EXTRA_MEMBER_PRICE_INR,
  FAMILY_MAX_EXTRA_MEMBER_COUNT,
  FAMILY_MAX_INVITED_MEMBER_COUNT,
} from '@/lib/family/family-config'
import {
  calculateSeatUsage,
  areIncludedSeatsFull,
  calculateRequiredExtraSeatsAfterNextInvite,
  canReusePaidExtraSeatForNextInvite,
} from '@/lib/family/family-seat-utils'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import {
  checkOwnerCannotInviteSelf,
  checkNoDuplicatePendingInvite,
  checkNotAlreadyActiveMember,
} from '@/lib/family/family-abuse-prevention'

/**
 * POST /api/family/extra-seat/intent
 *
 * If no paid reusable seat exists, create a payment intent.
 * If a paid reusable seat exists, create/send the extra-seat invite immediately with no extra charge.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const rawEmail = body.email as string

    if (!rawEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    let invitedEmail: string
    try {
      invitedEmail = normalizeInviteEmail(rawEmail)
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 })
    }

    const entitlement = await resolveEffectiveEntitlement(user.id)
    if (!entitlement.isFamilyOwner) {
      return NextResponse.json({ error: 'Only the Family owner can add extra seats' }, { status: 403 })
    }

    const selfCheck = await checkOwnerCannotInviteSelf(supabase, user.id, invitedEmail)
    if (!selfCheck.valid) {
      return NextResponse.json({ error: selfCheck.error }, { status: 400 })
    }

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, extra_seat_count, current_period_end, scheduled_action')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .maybeSingle()

    if (groupError) {
      console.error('[extra-seat-intent] Family group fetch error:', groupError)
      return NextResponse.json({ error: 'Failed to load family group' }, { status: 500 })
    }

    if (!familyGroup) {
      return NextResponse.json({ error: 'No active family group found' }, { status: 403 })
    }

    if (familyGroup.scheduled_action === 'cancel_at_period_end' || familyGroup.scheduled_action === 'downgrade_to_pro_at_period_end') {
      return NextResponse.json(
        {
          error: 'cannot_invite_during_billing_change',
          message: 'Cannot create new invites while Family plan changes are scheduled.',
        },
        { status: 409 }
      )
    }

    const dupCheck = await checkNoDuplicatePendingInvite(supabase, familyGroup.id, invitedEmail)
    if (!dupCheck.valid) {
      return NextResponse.json({ error: dupCheck.error }, { status: 409 })
    }

    const activeCheck = await checkNotAlreadyActiveMember(supabase, familyGroup.id, invitedEmail)
    if (!activeCheck.valid) {
      return NextResponse.json({ error: activeCheck.error }, { status: 409 })
    }

    const { data: activeMembers = [] } = await supabase
      .from('family_members')
      .select('id, role, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')

    const { data: pendingInvites = [] } = await supabase
      .from('family_invites')
      .select('id, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'pending')

    const { data: seatAddons = [] } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')

    const seatUsage = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup,
      seatAddons: seatAddons || [],
    })

    if (!areIncludedSeatsFull(seatUsage)) {
      return NextResponse.json(
        { error: 'Included seats are still available. Send a normal invite instead.' },
        { status: 400 }
      )
    }

    const invitedAfterThis = seatUsage.totalSeatsUsed + 1
    if (invitedAfterThis > FAMILY_MAX_INVITED_MEMBER_COUNT) {
      return NextResponse.json(
        {
          error: 'family_member_limit_reached',
          message: `Family plan maximum reached. Renewly Family supports up to ${FAMILY_MAX_INVITED_MEMBER_COUNT} invited members in this MVP.`,
          maxInvitedMembers: FAMILY_MAX_INVITED_MEMBER_COUNT,
        },
        { status: 400 }
      )
    }

    const requiredExtraSeatsAfterThis = calculateRequiredExtraSeatsAfterNextInvite(seatUsage)
    if (requiredExtraSeatsAfterThis > FAMILY_MAX_EXTRA_MEMBER_COUNT) {
      return NextResponse.json(
        {
          error: 'extra_member_limit_reached',
          message: `You can add up to ${FAMILY_MAX_EXTRA_MEMBER_COUNT} paid extra members in this MVP.`,
          maxExtraMembers: FAMILY_MAX_EXTRA_MEMBER_COUNT,
        },
        { status: 400 }
      )
    }

    const now = new Date()

    if (canReusePaidExtraSeatForNextInvite(seatUsage)) {
      const rawToken = generateInviteToken()
      const tokenHash = hashInviteToken(rawToken)
      const expiryDate = getInviteExpiryDate()

      const { data: newInvite, error: inviteError } = await supabase
        .from('family_invites')
        .insert({
          family_group_id: familyGroup.id,
          invited_email: invitedEmail,
          invited_by: user.id,
          token_hash: tokenHash,
          status: 'pending',
          seat_type: 'extra',
          expires_at: expiryDate.toISOString(),
          extra_seat_payment_intent_id: null,
        })
        .select('id')
        .single()

      if (inviteError || !newInvite) {
        console.error('[extra-seat-intent] Reused-seat invite insert error:', inviteError)
        return NextResponse.json({ error: 'Failed to create invite using reusable paid seat' }, { status: 500 })
      }

      // If this invite consumes all paid seats, clear cancel_at_period_end because no surplus remains.
      if (requiredExtraSeatsAfterThis >= seatUsage.paidActiveExtraSeats) {
        const { error: clearCancelError } = await supabase
          .from('family_seat_addons')
          .update({ cancel_at_period_end: false, updated_at: now.toISOString() })
          .eq('family_group_id', familyGroup.id)
          .eq('status', 'active')

        if (clearCancelError) {
          console.warn('[extra-seat-intent] Failed to clear cancel_at_period_end:', clearCancelError)
        }
      }

      const requestOrigin =
        request.headers.get('origin') ||
        request.nextUrl.origin ||
        undefined

      const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

      const emailResult = await sendFamilyInviteEmail({
        invitedEmail,
        ownerEmail: ownerProfile?.email || user.email || 'contact@renewly.in',
        ownerName: ownerProfile?.full_name || ownerProfile?.email || 'Family owner',
        inviteUrl,
        expiresInDays: 7,
      })

      return NextResponse.json({
        success: true,
        inviteCreated: true,
        reusedPaidSeat: true,
        inviteId: newInvite.id,
        emailSent: emailResult.sent,
        inviteUrl: emailResult.reason === 'email_unconfigured' ? inviteUrl : undefined,
        warning:
          emailResult.reason === 'email_unconfigured'
            ? 'Email is not configured. Use this QA invite link for testing.'
            : undefined,
        message: `Invite sent to ${invitedEmail} using an already-paid extra seat.`,
      })
    }

    const { data: existingIntent } = await supabase
      .from('family_extra_seat_payment_intents')
      .select('id, status, expires_at')
      .eq('owner_user_id', user.id)
      .eq('family_group_id', familyGroup.id)
      .ilike('invited_email', invitedEmail)
      .eq('status', 'pending')
      .gt('expires_at', now.toISOString())
      .maybeSingle()

    let intentId: string
    let intentExpiresAt: string

    if (existingIntent) {
      intentId = existingIntent.id
      intentExpiresAt = existingIntent.expires_at
    } else {
      const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

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
          metadata: {
            required_extra_seats_after_invite: requiredExtraSeatsAfterThis,
          },
          expires_at: newExpiresAt.toISOString(),
        })
        .select('id, expires_at')
        .single()

      if (insertError || !newIntent) {
        console.error('[extra-seat-intent] Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to create payment intent' }, { status: 500 })
      }

      intentId = newIntent.id
      intentExpiresAt = newIntent.expires_at
    }

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
        previewQaEnabled: process.env.QA_PLAN_OVERRIDE_ENABLED === 'true',
        copy: `Adding this member requires an extra seat at ₹${FAMILY_EXTRA_MEMBER_PRICE_INR}/month.`,
      },
    })
  } catch (error) {
    console.error('[extra-seat-intent] Error:', error)
    return NextResponse.json({ error: 'Failed to create extra-seat intent' }, { status: 500 })
  }
}
