'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeInviteEmail, isInviteExpired } from '@/lib/family/family-invite-utils'
import { syncRenewlyFamilyMemberSubscription } from '@/lib/billing/renewly-subscription-sync'
import { invalidateCache } from '@/lib/redis'
import { revalidateTag } from 'next/cache'
import { checkUserNotInMultipleFamilies } from '@/lib/family/family-abuse-prevention'
import { notifyOwnerOfInviteAction } from '@/lib/family/send-owner-notifications'

/**
 * POST /api/family/invites/accept-direct
 * 
 * Accept family invite directly without token (fallback for lost token redirects)
 * Body: { inviteId: "<pending invite id>" }
 * 
 * Validates:
 * - Invite exists and is pending
 * - Not expired
 * - Signed-in email matches invited email
 * - No duplicate active membership
 * - Family group is active
 * 
 * Actions:
 * - Create active family_members row
 * - Mark invite accepted
 * - Grant Family access (update profile.plan)
 * - Sync Renewly Family subscription as covered_by_family
 * - Invalidate caches
 */
export async function POST(request: Request) {
  try {
    // Initialize Supabase client inside the function (not at module level)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[accept-direct] Missing Supabase env vars')
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
    const inviteId = body.inviteId as string

    if (!inviteId || !inviteId.trim()) {
      return NextResponse.json(
        { error: 'Invite ID is required' },
        { status: 400 }
      )
    }

    // Fetch pending invite by ID (no token required)
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
      .eq('id', inviteId.trim())
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
        revalidateTag(`subscriptions:${user.id}`)
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
      if (invite.status === 'cancelled') {
        return NextResponse.json(
          { error: 'This invite has been cancelled' },
          { status: 409 }
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
    
    try {
      const signedInNormalized = normalizeInviteEmail(signedInEmail)
      const invitedNormalized = normalizeInviteEmail(invite.invited_email)

      // Verify email match (CRITICAL: must match exact invited email)
      if (signedInNormalized !== invitedNormalized) {
        return NextResponse.json(
          {
            error: `This invite was sent to ${invite.invited_email}. Please sign in with that email to accept.`,
          },
          { status: 403 }
        )
      }
    } catch (emailError) {
      console.error('[accept-direct] Email normalization error:', emailError)
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
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

    // Create active family membership
    const { error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_group_id: invite.family_group_id,
        user_id: user.id,
        email: normalizeInviteEmail(signedInEmail),
        role: 'member',
        status: 'active',
        seat_type: invite.seat_type,
        joined_at: new Date().toISOString(),
      })

    if (memberError) {
      console.error('[accept-direct] Member create error:', memberError)
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
      console.error('[accept-direct] Invite update error:', updateError)
    }

    // Grant Family access to member (update profile.plan)
    const { error: planError } = await supabase
      .from('profiles')
      .update({ plan: 'family' })
      .eq('id', user.id)

    if (planError) {
      console.error('[accept-direct] Plan update error:', planError)
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
      console.error('[accept-direct] Sync error:', syncError)
      // Non-blocking: sync error doesn't prevent acceptance, but we log it for debugging
    }

    // Invalidate Redis cache for member subscriptions
    await invalidateCache(`subscriptions:${user.id}`)

    // Invalidate Next.js cache tags
    revalidateTag(`subscriptions:${user.id}`)
    revalidateTag('profile')

    // Notify owner (non-blocking - doesn't affect response)
    notifyOwnerOfInviteAction({
      inviteId: invite.id,
      familyGroupId: invite.family_group_id,
      invitedEmail: invite.invited_email,
      action: 'accepted',
    }).catch((error) => {
      console.warn('[accept-direct] Failed to notify owner:', error)
    })

    return NextResponse.json({
      success: true,
      sync: syncStatus,
      message: 'Invite accepted',
    })
  } catch (error) {
    console.error('[accept-direct] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
