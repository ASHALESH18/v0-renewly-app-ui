import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateCache } from '@/lib/redis'
import { sendFamilyMemberRemovedEmail } from '@/lib/email/family-member-removed-email'
import { revalidateTag } from 'next/cache'

/**
 * POST /api/family/members/[memberId]/remove
 *
 * Remove an active family member
 * - Owner only
 * - Active member only (not owner)
 * - Updates status to 'removed'
 * - Cancels the member's system-managed Renewly Family subscription
 * - May downgrade member profile to free if needed
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> }
) {
  try {
    // Initialize Supabase client inside the function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-members-remove] Missing Supabase env vars')
      return NextResponse.json(
        { error: 'Service misconfigured' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params in Next.js 16
    const { memberId } = await context.params
    const normalizedMemberId = typeof memberId === 'string' ? memberId.trim() : ''

    if (
      !normalizedMemberId ||
      normalizedMemberId === 'undefined' ||
      normalizedMemberId === 'null'
    ) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    // Fetch the family member record
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .select('id, family_group_id, user_id, status, role, email')
      .eq('id', normalizedMemberId)
      .single()

    if (memberError) {
      if (memberError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      throw memberError
    }

    // Verify member is active
    if (member.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active members can be removed' },
        { status: 400 }
      )
    }

    // Verify member is not owner
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the family owner' },
        { status: 400 }
      )
    }

    // Fetch family group and verify ownership
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id')
      .eq('id', member.family_group_id)
      .single()

    if (groupError) {
      throw groupError
    }

    if (familyGroup.owner_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Only family owner can remove members' },
        { status: 403 }
      )
    }

    // Update member status to removed
    const { error: updateMemberError } = await supabase
      .from('family_members')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        removed_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', normalizedMemberId)

    if (updateMemberError) {
      throw updateMemberError
    }

    // Check if member's plan needs to be downgraded to free
    // Only downgrade if they have no independent paid subscription
    const { data: memberProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, plan, email, full_name')
      .eq('id', member.user_id)
      .single()

    if (profileFetchError) {
      console.warn('[family-members-remove] Failed to fetch member profile:', profileFetchError)
    }

    let profileDowngraded = false
    let memberEmail = member.email || memberProfile?.email || 'unknown'

    if (memberProfile && memberProfile.plan === 'family') {
      // Check if member has independent active paid subscription (not covered by family)
      const { data: independentSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, managed_plan')
        .eq('user_id', member.user_id)
        .eq('is_system_managed', true)
        .eq('system_source', 'renewly_billing')
        .eq('status', 'active')
        .eq('covered_by_family', false)
        .in('managed_plan', ['pro', 'family'])
        .single()

      // Also check for null covered_by_family (independent subscriptions)
      let hasIndependentSub = !!independentSubscription

      if (!hasIndependentSub && !subError) {
        const { data: nullCoveredSub } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('user_id', member.user_id)
          .eq('is_system_managed', true)
          .eq('system_source', 'renewly_billing')
          .eq('status', 'active')
          .is('covered_by_family', null)
          .in('managed_plan', ['pro', 'family'])
          .single()

        hasIndependentSub = !!nullCoveredSub
      }

      if (subError?.code !== 'PGRST116' && subError) {
        // Error other than not found
        console.warn('[family-members-remove] Error checking independent subscription:', subError)
      }

      // Only downgrade if no independent paid subscription exists
      if (!hasIndependentSub) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', member.user_id)

        if (updateProfileError) {
          console.warn('[family-members-remove] Failed to update member profile:', updateProfileError)
        } else {
          profileDowngraded = true
        }
      }
    }

    // Cancel the member's system-managed Renewly Family subscription (covered by family)
    let coveredSubscriptionCancelled = false
    const now = new Date().toISOString()
    const { data: coveredSubscription, error: getCoveredSubError } = await supabase
      .from('subscriptions')
      .select('id, system_metadata')
      .eq('user_id', member.user_id)
      .eq('is_system_managed', true)
      .eq('system_source', 'renewly_billing')
      .eq('managed_plan', 'family')
      .eq('covered_by_family', true)
      .eq('family_group_id', member.family_group_id)
      .single()

    if (getCoveredSubError?.code !== 'PGRST116') {
      console.warn('[family-members-remove] Error fetching covered subscription:', getCoveredSubError)
    }

    if (coveredSubscription) {
      // Merge existing metadata with removal info
      const existingMetadata = coveredSubscription.system_metadata || {}
      const updatedMetadata = {
        ...existingMetadata,
        removed_from_family: true,
        removed_at: now,
        removed_by: user.id,
      }

      const { error: cancelSubscriptionError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          updated_at: now,
          system_metadata: updatedMetadata,
        })
        .eq('id', coveredSubscription.id)

      if (cancelSubscriptionError) {
        console.warn('[family-members-remove] Failed to cancel subscription:', cancelSubscriptionError)
      } else {
        coveredSubscriptionCancelled = true
      }
    }

    // Invalidate caches for the removed member
    try {
      await invalidateCache(`subscriptions:${member.user_id}`)
    } catch (e) {
      console.warn('[family-members-remove] Cache invalidation error:', e)
    }

    // Revalidate Next.js tags for member
    revalidateTag(`subscriptions:${member.user_id}`)
    revalidateTag('profile')

    // Send removal email to member
    let emailSent = false
    try {
      // Fetch owner profile for email
      const { data: ownerProfile, error: ownerError } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', familyGroup.owner_user_id)
        .single()

      if (ownerError) {
        console.warn('[family-members-remove] Failed to fetch owner profile:', ownerError)
      }

      const ownerEmail = ownerProfile?.email || 'contact@renewly.in'
      const ownerName = ownerProfile?.full_name || 'Family owner'

      const emailResult = await sendFamilyMemberRemovedEmail({
        memberEmail,
        ownerEmail,
        ownerName,
      })

      emailSent = emailResult.sent
    } catch (e) {
      console.warn('[family-members-remove] Email send error:', e)
    }

    return NextResponse.json({
      success: true,
      memberUserId: member.user_id,
      memberEmail,
      profileDowngraded,
      coveredSubscriptionCancelled,
      emailSent,
    })
  } catch (error) {
    console.error('[family-members-remove] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
