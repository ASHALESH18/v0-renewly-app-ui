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
      .select('id, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')
      .neq('role', 'owner')

    const { data: pendingInvites = [] } = await supabase
      .from('family_invites')
      .select('id, seat_type')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'pending')

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

    const includedLimit = familyGroup.included_member_limit ?? FAMILY_INCLUDED_MEMBER_COUNT
    const includedUsed =
      (activeMembers || []).filter((member: any) => (member.seat_type || 'included') === 'included').length +
      (pendingInvites || []).filter((invite: any) => (invite.seat_type || 'included') === 'included').length

    if (includedUsed >= includedLimit) {
      // F7.1: Check if reusable extra seats are available before payment
      const { data: seatAddons = [], error: addonsError } = await supabase
        .from('family_seat_addons')
        .select('quantity, cancel_at_period_end, status')
        .eq('family_group_id', familyGroup.id)

      if (!addonsError && seatAddons.length > 0) {
        // Calculate reusable extra seats (paid but not used)
        const totalPaidSeats = seatAddons.reduce((sum, addon) => {
          if (addon.status === 'active' && !addon.cancel_at_period_end) {
            return sum + (addon.quantity || 0)
          }
          return sum
        }, 0)

        const { data: extraMembers = [] } = await supabase
          .from('family_members')
          .select('id, seat_type')
          .eq('family_group_id', familyGroup.id)
          .eq('status', 'active')
          .eq('seat_type', 'extra')

        const { data: extraPendingInvites = [] } = await supabase
          .from('family_invites')
          .select('id, seat_type')
          .eq('family_group_id', familyGroup.id)
          .eq('status', 'pending')
          .eq('seat_type', 'extra')

        const reusableExtraSeats = totalPaidSeats - ((extraMembers?.length || 0) + (extraPendingInvites?.length || 0))

        // F7.1B: If reusable seats available, create extra invite instead of returning 402
        if (reusableExtraSeats > 0) {
          // F7.1B: Check for historical invite (cancelled/accepted/expired) and allow reinvite
          const { data: historicalInvite } = await supabase
            .from('family_invites')
            .select('id')
            .eq('family_group_id', familyGroup.id)
            .ilike('invited_email', invitedEmail)
            .in('status', ['pending', 'accepted', 'cancelled', 'expired'])
            .limit(1)

          // If there's a pending invite, reject (duplicate pending)
          if (historicalInvite && historicalInvite.length > 0) {
            const inv = historicalInvite[0]
            const { data: existingStatus } = await supabase
              .from('family_invites')
              .select('status, seat_type')
              .eq('id', inv.id)
              .single()

            if (existingStatus?.status === 'pending') {
              return NextResponse.json(
                { error: 'Invite already sent to this email' },
                { status: 409 }
              )
            }
            // Historical invite is accepted/cancelled/expired - allow new invite
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
            console.error('[family-invites] Insert error for extra seat:', insertError)
            return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
          }

          console.log('[v0] F7.1B: Created extra seat invite', {
            inviteId: insertedData?.[0]?.id,
            invitedEmail,
            seatType: 'extra',
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
            console.warn('[family-invites] Email send failed (extra seat invite still created):', emailResult.error)
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
        }
      }

      // F7.1: No reusable seats, so payment required
      return NextResponse.json(
        {
          error: 'included_seats_full',
          message: `You've used all ${includedLimit} included Family seats.`,
          extraSeatRequired: true,
          extraSeatPriceINR: 99,
          nextAction: 'create_extra_seat_intent',
        },
        { status: 402 }
      )
    }

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
      console.error('[family-invites] Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    const requestOrigin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      undefined

    const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

    if (process.env.VERCEL_ENV !== 'production') {
      console.info('[family-invites] Invite created', {
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
      // Email send failed, but invite was created - return success with warning
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
  } catch (error) {
    console.error('[family-invites] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
