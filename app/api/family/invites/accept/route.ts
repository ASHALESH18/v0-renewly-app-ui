'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { hashInviteToken, isInviteExpired, normalizeInviteEmail } from '@/lib/family/family-invite-utils'
import { syncRenewlyFamilyMemberSubscription } from '@/lib/billing/renewly-subscription-sync'
import { invalidateCache } from '@/lib/redis'
import { revalidateTag } from 'next/cache'
import { checkUserNotInMultipleFamilies, checkUserNotOwnerOfOtherFamily } from '@/lib/family/family-abuse-prevention'

/**
 * POST /api/family/invites/accept
 * 
 * Accept family invite with token
 * Body: { token: "<raw token>" }
 * 
 * Validates:
 * - Token exists and is pending
 * - Not expired
 * - Signed-in email matches invited email
 * - No duplicate active membership
 * 
 * Actions:
 * - Create active family_members row
 * - Mark invite accepted
 * - Grant Family access (update profile.plan)
 * - Sync Renewly Family subscription as covered_by_family
 * - Invalidate caches
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-invites-accept] Missing Supabase env vars')
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

    // Parse body
    const body = await request.json()
    const token = body.token as string

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Hash token to find invite
    const tokenHash = hashInviteToken(token)

    // Fetch pending invite by token
    const { data: invite, error: inviteError } = await supabase
      .from('family_invites')
      .select(`
        id,
        family_group_id,
        invited_email,
        status,
        expires_at,
        seat_type,
        family_groups (
          id,
          owner_user_id,
          status,
          current_period_end
        )
      `)
      .eq('token_hash', tokenHash)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Check if already accepted (idempotency)
    if (invite.status === 'accepted') {
      // Check if user already has active membership
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_group_id', invite.family_group_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (existingMember) {
        // Already accepted, sync again as idempotent operation
        const familyGroup = (invite.family_groups as any)
        if (familyGroup) {
          await syncRenewlyFamilyMemberSubscription({
            memberUserId: user.id,
            ownerUserId: familyGroup.owner_user_id,
            familyGroupId: familyGroup.id,
            currentPeriodEnd: familyGroup.current_period_end,
          })
        }
        revalidateTag(`subscriptions:${user.id}`, 'max', 'max')
        return NextResponse.json({
          success: true,
          message: 'Already accepted',
        })
      }
    }

    // Check status
    if (invite.status !== 'pending') {
      if (invite.status === 'expired') {
        return NextResponse.json(
          { error: 'This invite has expired' },
          { status: 410 }
        )
      }
      return NextResponse.json(
        { error: 'This invite is no longer valid' },
        { status: 409 }
      )
    }

    // Check expiry
    if (isInviteExpired(invite.expires_at)) {
      // Mark expired
      await supabase
        .from('family_invites')
        .update({ status: 'expired' })
        .eq('id', invite.id)

      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      )
    }

    // Get signed-in user email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    const signedInEmail = userProfile?.email || user.email || ''
    const signedInNormalized = normalizeInviteEmail(signedInEmail)
    const invitedNormalized = normalizeInviteEmail(invite.invited_email)

    // Verify email match
    if (signedInNormalized !== invitedNormalized) {
      return NextResponse.json(
        {
          error: `This invite was sent to ${invite.invited_email}. Please sign in with that email to accept.`,
        },
        { status: 403 }
      )
    }

    // Check family group is active
    const familyGroup = (invite.family_groups as any)
    if (!familyGroup || (familyGroup.status !== 'active' && familyGroup.status !== 'past_due')) {
      return NextResponse.json(
        { error: 'Family group is no longer active' },
        { status: 409 }
      )
    }

    // Check no duplicate active member
    const { data: duplicateMember } = await supabase
      .from('family_members')
      .select('id')
      .eq('family_group_id', invite.family_group_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (duplicateMember) {
      return NextResponse.json(
        { error: 'You are already a member of this family group' },
        { status: 409 }
      )
    }

    const multiFamilyCheck = await checkUserNotInMultipleFamilies(supabase, user.id)
    if (!multiFamilyCheck.valid) {
      return NextResponse.json(
        { error: multiFamilyCheck.error },
        { status: 409 }
      )
    }

    // F7-2: Check user is not already owner of another active family
    const ownerConflictCheck = await checkUserNotOwnerOfOtherFamily(supabase, user.id, invite.family_group_id)
    if (!ownerConflictCheck.valid) {
      return NextResponse.json(
        { error: ownerConflictCheck.error },
        { status: 409 }
      )
    }

    // Create active family membership
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_group_id: invite.family_group_id,
        user_id: user.id,
        email: signedInNormalized,
        role: 'member',
        status: 'active',
        seat_type: invite.seat_type,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('[accept-invite] Member create error:', memberError)
      return NextResponse.json(
        { error: 'Failed to create membership' },
        { status: 500 }
      )
    }

    // Update invite as accepted
    const { error: updateError } = await supabase
      .from('family_invites')
      .update({
        status: 'accepted',
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invite.id)

    if (updateError) {
      console.error('[accept-invite] Invite update error:', updateError)
    }

    // Grant Family access to member (update profile.plan)
    const { error: planError } = await supabase
      .from('profiles')
      .update({ plan: 'family' })
      .eq('id', user.id)

    if (planError) {
      console.error('[accept-invite] Plan update error:', planError)
    }

    // Sync Renewly Family subscription as covered_by_family
    let syncStatus: 'completed' | 'failed' = 'failed'
    try {
      await syncRenewlyFamilyMemberSubscription({
        memberUserId: user.id,
        ownerUserId: familyGroup.owner_user_id,
        familyGroupId: familyGroup.id,
        currentPeriodEnd: familyGroup.current_period_end,
      })
      syncStatus = 'completed'
    } catch (syncError) {
      console.error('[accept-invite] Sync error:', syncError)
      // Non-blocking: sync error doesn't prevent acceptance, but we log it for debugging
    }

    // Invalidate Redis cache for member subscriptions
    await invalidateCache(`subscriptions:${user.id}`)

    // Invalidate Next.js cache tags
    revalidateTag(`subscriptions:${user.id}`, 'max', 'max')
    revalidateTag('profile', 'max', 'max')

    return NextResponse.json({
      success: true,
      sync: syncStatus,
      message: 'Invite accepted',
    })
  } catch (error) {
    console.error('[accept-invite] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
