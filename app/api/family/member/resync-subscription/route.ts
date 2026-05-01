'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyFamilyMemberSubscription } from '@/lib/billing/renewly-subscription-sync'
import { invalidateCache } from '@/lib/redis'
import { revalidateTag } from 'next/cache'

/**
 * POST /api/family/member/resync-subscription
 * 
 * Self-healing endpoint for Family members to resync their Renewly Family subscription.
 * 
 * Validates:
 * - User is authenticated
 * - User is an active family member (not owner, not pending)
 * - Family group is active or past_due
 * 
 * Actions:
 * - Calls syncRenewlyFamilyMemberSubscription
 * - Invalidates Redis cache
 * - Revalidates cache tags
 */
export async function POST() {
  try {
    // Initialize Supabase client inside the function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[resync-subscription] Missing Supabase env vars')
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

    // Fetch active family membership for user
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select(`
        id,
        user_id,
        family_group_id,
        role,
        status,
        family_groups (
          id,
          owner_user_id,
          status,
          current_period_end
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .neq('role', 'owner') // Must not be owner
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'No active Family membership found.' },
        { status: 403 }
      )
    }

    // Check family group is active
    const familyGroup = (membership.family_groups as any)
    if (!familyGroup || (familyGroup.status !== 'active' && familyGroup.status !== 'past_due')) {
      return NextResponse.json(
        { error: 'Family group is no longer active' },
        { status: 409 }
      )
    }

    // Sync Renewly Family subscription as covered_by_family
    try {
      await syncRenewlyFamilyMemberSubscription({
        memberUserId: user.id,
        ownerUserId: familyGroup.owner_user_id,
        familyGroupId: familyGroup.id,
        currentPeriodEnd: familyGroup.current_period_end,
      })
    } catch (syncError) {
      console.error('[resync-subscription] Sync error:', syncError)
      throw syncError // Don't swallow the error for this endpoint
    }

    // Invalidate Redis cache for member subscriptions
    await invalidateCache(`subscriptions:${user.id}`)

    // Revalidate cache tags
    revalidateTag(`subscriptions:${user.id}`)
    revalidateTag('profile')

    return NextResponse.json({
      success: true,
      message: 'Family subscription resynced',
    })
  } catch (error) {
    console.error('[resync-subscription] Error:', error)
    return NextResponse.json(
      { error: 'Failed to resync Family subscription' },
      { status: 500 }
    )
  }
}
