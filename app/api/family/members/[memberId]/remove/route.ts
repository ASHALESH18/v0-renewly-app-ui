import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
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
    const { data: memberProfile } = await supabase
      .from('profiles')
      .select('id, plan, subscription_status')
      .eq('id', member.user_id)
      .single()

    if (memberProfile && memberProfile.plan === 'family') {
      // Only downgrade if they're on family plan (not an independent pro/owner)
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_status: 'inactive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', member.user_id)

      if (updateProfileError) {
        console.warn('[family-members-remove] Failed to update member profile:', updateProfileError)
        // Non-blocking error: continue to cancel subscription
      }
    }

    // Cancel the member's system-managed Renewly Family subscription
    const { error: cancelSubscriptionError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        system_metadata: {
          removed_from_family: true,
          removed_at: new Date().toISOString(),
        },
      })
      .eq('user_id', member.user_id)
      .eq('is_system_managed', true)
      .eq('system_source', 'renewly_billing')
      .eq('managed_plan', 'family')
      .eq('covered_by_family', true)
      .eq('family_group_id', member.family_group_id)

    if (cancelSubscriptionError) {
      console.warn('[family-members-remove] Failed to cancel subscription:', cancelSubscriptionError)
      // Non-blocking error: member already removed from family
    }

    // Invalidate caches for the removed member
    // Note: Redis invalidation is async and may not complete before response
    try {
      const cacheRes = await fetch(
        `${request.nextUrl.origin}/api/cache/invalidate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: `subscriptions:${member.user_id}` }),
        }
      )
      if (!cacheRes.ok) {
        console.warn('[family-members-remove] Cache invalidation request failed')
      }
    } catch (e) {
      console.warn('[family-members-remove] Cache invalidation error:', e)
    }

    // Revalidate Next.js tags for member
    revalidateTag(`subscriptions:${member.user_id}`)
    revalidateTag('profile')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[family-members-remove] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
