'use server'

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
import {
  FAMILY_INCLUDED_MEMBER_COUNT,
  FAMILY_MAX_INVITED_MEMBER_COUNT,
} from '@/lib/family/family-config'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import {
  checkOwnerCannotInviteSelf,
  checkNoDuplicatePendingInvite,
  checkNotAlreadyActiveMember,
} from '@/lib/family/family-abuse-prevention'
import {
  calculateSeatUsage,
  canReusePaidExtraSeatForNextInvite,
  canInviteWithIncludedSeat,
} from '@/lib/family/family-seat-utils'

/**
 * POST /api/family/invites
 *
 * Creates a normal included-seat invite.
 * If included seats are full, returns 402 so the UI starts F6C extra-seat flow.
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
      return NextResponse.json({ error: 'Only the Family owner can invite members' }, { status: 403 })
    }

    const { data: ownerProfile, error: ownerProfileError } = await supabase
      .from('profiles')
      .select('plan, email, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (ownerProfileError) {
      console.warn('[family-invites] Owner profile fetch warning:', ownerProfileError)
    }

    const selfCheck = await checkOwnerCannotInviteSelf(supabase, user.id, invitedEmail)
    if (!selfCheck.valid) {
      return NextResponse.json({ error: selfCheck.error }, { status: 400 })
    }

    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, scheduled_action')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .maybeSingle()

    if (groupError) {
      console.error('[family-invites] Family group fetch error:', groupError)
      return NextResponse.json({ error: 'Failed to load family group' }, { status: 500 })
    }

    if (!familyGroup && ownerProfile?.plan !== 'family') {
      return NextResponse.json({ error: 'Family plan required to invite members' }, { status: 403 })
    }

    if (!familyGroup) {
      return NextResponse.json({ error: 'No active family group found' }, { status: 403 })
    }

    // F10: Block invites if family cancellation/downgrade is scheduled
    if (
      familyGroup.scheduled_action === 'cancel_at_period_end' ||
      familyGroup.scheduled_action === 'downgrade_to_pro_at_period_end'
    ) {
      return NextResponse.json(
        {
          error: 'Family plan changes are already scheduled',
          message: 'New invites are paused until the billing change is resolved.',
        },
        { status: 409 }
      )
    }

    if (familyGroup.scheduled_action === 'cancel_at_period_end') {
      return NextResponse.json(
        {
          error: 'cannot_invite_during_cancellation',
          message: 'Cannot create new invites while Family plan cancellation is scheduled.',
          nextAction: 'cancel_scheduled_cancellation',
        },
        { status: 400 }
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

    // F7.1D-R: Fetch active paid extra-seat add-ons with full details
    const { data: seatAddons = [], error: addonsError } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroup.id)

    if (addonsError) {
      console.error('[family-invites] F7.1D-R: Error fetching seat addons:', addonsError)
    }

    // F7.1D-R: Use seat calculation utility for accurate seat usage
    const seatUsage = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup: {
        included_member_limit: familyGroup.included_member_limit,
        extra_seat_count: familyGroup.included_member_limit, // fallback
        current_period_end: null, // will be updated from addons
      },
      seatAddons: seatAddons || [],
    })

    const invitedPeopleCount = (activeMembers?.length || 0) + (pendingInvites?.length || 0)

    if (invitedPeopleCount >= FAMILY_MAX_INVITED_MEMBER_COUNT) {
      return NextResponse.json(
        {
          error: 'family_member_limit_reached',
          message: `Family plan maximum reached. Renewly Family supports up to ${FAMILY_MAX_INVITED_MEMBER_COUNT} invited members in this MVP.`,
          maxInvitedMembers: FAMILY_MAX_INVITED_MEMBER_COUNT,
        },
        { status: 400 }
      )
    }

    // F7.1D-R: Decision logic: included → extra → payment
    if (canInviteWithIncludedSeat(seatUsage)) {
      // A: Included seats available - create normal included-seat invite
      const rawToken = generateInviteToken()
      const tokenHash = hashInviteToken(rawToken)
      const expiryDate = getInviteExpiryDate()

      const { error: insertError } = await supabase
        .from('family_invites')
        .insert({
          family_group_id: familyGroup.id,
          invited_email: invitedEmail,
          invited_by: user.id,
          token_hash: tokenHash,
          status: 'pending',
          seat_type: 'included',
          expires_at: expiryDate.toISOString(),
        })

      if (insertError) {
        console.error('[family-invites] F7.1D-R: Insert error for included seat:', {
          email: invitedEmail,
          error: insertError.message,
          code: insertError.code,
        })
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
      }

      const requestOrigin =
        request.headers.get('origin') ||
        request.nextUrl.origin ||
        undefined

      const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

      if (process.env.VERCEL_ENV !== 'production') {
        console.info('[family-invites] F7.1D-R: Included seat invite created', {
          vercelEnv: process.env.VERCEL_ENV,
          invitedEmail,
          baseUrl: getInviteBaseUrl(requestOrigin),
        })
      }

      const emailResult = await sendFamilyInviteEmail({
        invitedEmail,
        ownerEmail: ownerProfile?.email || user.email || 'contact@renewly.in',
        ownerName: ownerProfile?.full_name || ownerProfile?.email || 'Family owner',
        inviteUrl,
        expiresInDays: 7,
      })

      if (emailResult.reason === 'email_unconfigured') {
        return NextResponse.json({
          success: true,
          emailSent: false,
          inviteUrl,
          warning: 'Email is not configured. Use this QA invite link for testing.',
        })
      }

      if (!emailResult.sent) {
        console.warn('[family-invites] Email send failed (invite still created):', emailResult.error)
        return NextResponse.json({
          success: true,
          emailSent: false,
          inviteUrl,
          warning: 'Invite created, but email delivery could not be confirmed. The invite will still appear in the member\'s app.',
        })
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
      })
    } else if (canReusePaidExtraSeatForNextInvite(seatUsage)) {
      // B: Included seats full BUT paid extra capacity available - create extra-seat invite
      // F7.1D-R: Check for duplicate pending invite before attempting creation
      const { data: existingPendingInvite } = await supabase
        .from('family_invites')
        .select('id, status')
        .eq('family_group_id', familyGroup.id)
        .ilike('invited_email', invitedEmail)
        .eq('status', 'pending')
        .limit(1)

      if (existingPendingInvite && existingPendingInvite.length > 0) {
        console.warn('[v0] F7.1D-R: Duplicate pending invite already exists', {
          email: invitedEmail,
          existingId: existingPendingInvite[0].id,
        })
        return NextResponse.json(
          { error: 'An invite is already pending for this email address' },
          { status: 409 }
        )
      }

      // Log detailed reuse state for debugging
      if (process.env.VERCEL_ENV !== 'production') {
        console.log('[v0] F7.1D-R: Creating reusable extra-seat invite', {
          email: invitedEmail,
          familyGroupId: familyGroup.id,
          includedSeatsUsed: seatUsage.includedSeatsUsed,
          includedLimit: seatUsage.includedLimit,
          paidActiveExtraSeats: seatUsage.paidActiveExtraSeats,
          activeExtraMembers: seatUsage.activeExtraMembers,
          pendingExtraInvites: seatUsage.pendingExtraInvites,
          reusableExtraSeats: seatUsage.paidActiveExtraSeats - (seatUsage.activeExtraMembers + seatUsage.pendingExtraInvites),
        })
      }

      const rawToken = generateInviteToken()
      const tokenHash = hashInviteToken(rawToken)
      const expiryDate = getInviteExpiryDate()

      const { error: insertError, data: insertedData } = await supabase
        .from('family_invites')
        .insert({
          family_group_id: familyGroup.id,
          invited_email: invitedEmail,
          invited_by: user.id,
          token_hash: tokenHash,
          status: 'pending',
          seat_type: 'extra',
          extra_seat_payment_intent_id: null,
          expires_at: expiryDate.toISOString(),
        })
        .select()

      if (insertError) {
        console.error('[family-invites] F7.1D-R: Insert error for extra-seat invite:', {
          email: invitedEmail,
          error: insertError.message,
          code: insertError.code,
          familyGroupId: familyGroup.id,
        })
        return NextResponse.json(
          { error: `Failed to create invite: ${insertError.message}` },
          { status: 500 }
        )
      }

      console.log('[v0] F7.1D-R: Extra-seat invite created successfully', {
        inviteId: insertedData?.[0]?.id,
        status: insertedData?.[0]?.status,
        email: invitedEmail,
      })

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

      if (!emailResult.sent) {
        console.warn('[family-invites] Email send failed (extra-seat invite still created):', emailResult.error)
        return NextResponse.json({
          success: true,
          emailSent: false,
          inviteUrl,
          warning: 'Invite created using available extra seat, but email delivery could not be confirmed.',
        })
      }

      return NextResponse.json({
        success: true,
        emailSent: true,
        message: 'Invite created using available extra seat.',
      })
    } else {
      // C: Included full + no reusable extra seats = payment required
      return NextResponse.json(
        {
          error: 'included_seats_full',
          message: `You've used all ${seatUsage.includedLimit} included Family seats.`,
          extraSeatRequired: true,
          extraSeatPriceINR: 99,
          nextAction: 'create_extra_seat_intent',
        },
        { status: 402 }
      )
    }
  } catch (error) {
    console.error('[family-invites] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
