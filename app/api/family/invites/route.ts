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
  getInviteExpiryDate 
} from '@/lib/family/family-invite-utils'
import { sendFamilyInviteEmail } from '@/lib/email/family-invite-email'
import { FAMILY_INCLUDED_MEMBER_COUNT } from '@/lib/family/family-config'
import { resolveEffectiveEntitlement } from '@/lib/entitlements/effective-plan'
import {
  checkOwnerCannotInviteSelf,
  checkNoDuplicatePendingInvite,
  checkNotAlreadyActiveMember,
} from '@/lib/family/family-abuse-prevention'

/**
 * POST /api/family/invites
 * 
 * Owner creates a pending invite for a family member
 * Body: { email: "member@example.com" }
 * 
 * Returns:
 * - { success: true, emailSent: true } if email sends
 * - { success: true, emailSent: false, inviteUrl, warning } if email unconfigured (QA mode)
 * - { error, status } if validation/creation fails
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-invites] Missing Supabase env vars')
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

    // Verify user is effective family owner (additional safety check)
    const entitlement = await resolveEffectiveEntitlement(user.id)
    if (!entitlement.isFamilyOwner) {
      return NextResponse.json(
        { error: 'Only the Family owner can invite members' },
        { status: 403 }
      )
    }

    // F10-1: Check owner cannot invite self
    const selfCheck = await checkOwnerCannotInviteSelf(supabase, user.id, invitedEmail)
    if (!selfCheck.valid) {
      return NextResponse.json(
        { error: selfCheck.error },
        { status: 400 }
      )
    }

    // Check: owner must be Family plan or have family group
    const { data: ownerProfilePlan } = await supabase
      .from('profiles')
      .select('plan, email, full_name')
      .eq('id', user.id)
      .single()

    // Fetch active family group for owner
    const { data: familyGroup } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, scheduled_action')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    // Owner must have Family plan or active family group
    if (!familyGroup && ownerProfilePlan?.plan !== 'family') {
      return NextResponse.json(
        { error: 'Family plan required to invite members' },
        { status: 403 }
      )
    }

    if (!familyGroup) {
      return NextResponse.json(
        { error: 'No active family group found' },
        { status: 403 }
      )
    }

    // F10-2: Check duplicate pending invite
    const dupCheck = await checkNoDuplicatePendingInvite(supabase, familyGroup.id, invitedEmail)
    if (!dupCheck.valid) {
      return NextResponse.json(
        { error: dupCheck.error },
        { status: 409 }
      )
    }

    // F10-3: Check not already active member
    const activeCheck = await checkNotAlreadyActiveMember(supabase, familyGroup.id, invitedEmail)
    if (!activeCheck.valid) {
      return NextResponse.json(
        { error: activeCheck.error },
        { status: 409 }
      )
    }

    // F8-lite: Check if Family cancellation is scheduled (block new invites)
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

    // Check: count included seats (for F3A only, no extra-seat payment)
    const { data: activeMembers } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'active')
      .neq('role', 'owner')
      .eq('seat_type', 'included')

    const { data: pendingIncludes } = await supabase
      .from('family_invites')
      .select('id')
      .eq('family_group_id', familyGroup.id)
      .eq('status', 'pending')
      .eq('seat_type', 'included')

    const currentIncludedCount = (activeMembers?.length || 0) + (pendingIncludes?.length || 0)

    // Check if included seats are full using family group's limit
    const includedMemberLimit = familyGroup.included_member_limit ?? FAMILY_INCLUDED_MEMBER_COUNT
    if (currentIncludedCount >= includedMemberLimit) {
      return NextResponse.json(
        {
          error: 'included_seats_full',
          message: `You've used all ${includedMemberLimit} included Family seats.`,
          extraSeatRequired: true,
          extraSeatPriceINR: 99,
          nextAction: 'create_extra_seat_intent',
        },
        { status: 402 }
      )
    }

    // Generate secure token
    const rawToken = generateInviteToken()
    const tokenHash = hashInviteToken(rawToken)
    const expiryDate = getInviteExpiryDate()

    // Create invite in database
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
      return NextResponse.json(
        { error: 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Build invite URL using request origin for environment-aware URL resolution
    const requestOrigin =
      request.headers.get('origin') ||
      request.nextUrl.origin ||
      undefined

    const inviteUrl = buildFamilyInviteUrl(rawToken, requestOrigin)

    // Add safe diagnostic logging in Preview/development (never log raw token or hash)
    if (process.env.VERCEL_ENV !== 'production') {
      console.info('[family-invites] invite created', {
        vercelEnv: process.env.VERCEL_ENV,
        invitedEmail,
        baseUrl: getInviteBaseUrl(requestOrigin),
      })
    }

    // Send email
    const emailResult = await sendFamilyInviteEmail({
      invitedEmail,
      ownerEmail: ownerProfile?.email || user.email || '',
      ownerName: ownerProfile?.email || 'Family member',
      inviteUrl,
      expiresInDays: 7,
    })

    // Return response based on email status
    if (emailResult.reason === 'email_unconfigured') {
      // QA mode: email not configured, return invite URL for manual testing
      return NextResponse.json({
        success: true,
        emailSent: false,
        inviteUrl,
        warning: 'Email is not configured. Use this QA invite link for testing.',
      })
    }

    if (!emailResult.sent) {
      // Production: email failed, return error
      console.error('[family-invites] Email send failed:', emailResult.error)
      return NextResponse.json(
        { error: 'Failed to send invite email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
    })
  } catch (error) {
    console.error('[family-invites] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
