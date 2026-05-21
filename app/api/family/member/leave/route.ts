import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { invalidateCache } from '@/lib/redis'
import { revalidateTag } from 'next/cache'
import { calculateSeatUsage, calculateExtraSeatReuseState } from '@/lib/family/family-seat-utils'
import { notifyFamilyMemberLeft } from '@/lib/notifications/family-event-notifications'

/**
 * POST /api/family/member/leave
 *
 * Allow an active family member to voluntarily leave the Renewly Family plan.
 * - Member only (not owner)
 * - Active membership only
 * - Updates status to 'removed' with removed_by = user.id
 * - Cancels the member's system-managed Renewly Family subscription (covered-by-family)
 * - Downgrades member profile to free if no independent paid subscription exists
 * - Sends non-blocking email notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-member-leave] Missing Supabase env vars')
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

    // Fetch active membership for current user
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id, family_group_id, user_id, status, role, seat_type')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (membershipError) {
      if (membershipError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No active Family membership found' },
          { status: 403 }
        )
      }
      throw membershipError
    }

    // Prevent owner from leaving through member route
    if (membership.role === 'owner') {
      return NextResponse.json(
        { error: 'Family owner cannot leave' },
        { status: 403 }
      )
    }

    // Fetch family group to verify it's active or past_due
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, status, included_member_limit, extra_seat_count, current_period_end')
      .eq('id', membership.family_group_id)
      .single()

    if (groupError) {
      throw groupError
    }

    if (!['active', 'past_due'].includes(familyGroup.status || '')) {
      return NextResponse.json(
        { error: 'Family plan is not active' },
        { status: 400 }
      )
    }

    // Update membership to removed
    const now = new Date().toISOString()
    const { error: updateMembershipError } = await supabase
      .from('family_members')
      .update({
        status: 'removed',
        removed_at: now,
        removed_by: user.id,
        updated_at: now,
      })
      .eq('id', membership.id)

    if (updateMembershipError) {
      throw updateMembershipError
    }

    // Fetch member profile for downgrade check
    const { data: memberProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('id, plan, email, full_name')
      .eq('id', user.id)
      .single()

    if (profileFetchError) {
      console.warn('[family-member-leave] Failed to fetch member profile:', profileFetchError)
    }

    let profileDowngraded = false
    let memberEmail = memberProfile?.email || user.email || 'unknown'

    // Downgrade profile to free only if no independent paid subscription
    if (memberProfile && memberProfile.plan === 'family') {
      // Check for independent active paid subscription (not covered by family)
      // Treat both false and null as independent (user has paid for their own plan)
      const { data: independentSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select('id, managed_plan')
        .eq('user_id', user.id)
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
          .eq('user_id', user.id)
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
        console.warn('[family-member-leave] Error checking independent subscription:', subError)
      }

      // Only downgrade if no independent paid subscription
      if (!hasIndependentSub) {
        const { error: updateProfileError } = await supabase
          .from('profiles')
          .update({
            plan: 'free',
            updated_at: now,
          })
          .eq('id', user.id)

        if (updateProfileError) {
          console.warn('[family-member-leave] Failed to update member profile:', updateProfileError)
        } else {
          profileDowngraded = true
        }
      }
    }

    // Cancel the member's covered Renewly Family subscription
    let coveredSubscriptionCancelled = false
    const { data: coveredSubscription, error: getCoveredSubError } = await supabase
      .from('subscriptions')
      .select('id, system_metadata')
      .eq('user_id', user.id)
      .eq('is_system_managed', true)
      .eq('system_source', 'renewly_billing')
      .eq('managed_plan', 'family')
      .eq('covered_by_family', true)
      .eq('family_group_id', membership.family_group_id)
      .single()

    if (getCoveredSubError?.code !== 'PGRST116') {
      console.warn('[family-member-leave] Error fetching covered subscription:', getCoveredSubError)
    }

    if (coveredSubscription) {
      // Merge existing metadata with leave info
      const existingMetadata = coveredSubscription.system_metadata || {}
      const updatedMetadata = {
        ...existingMetadata,
        left_family: true,
        left_at: now,
        left_by: user.id,
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
        console.warn('[family-member-leave] Failed to cancel subscription:', cancelSubscriptionError)
      } else {
        coveredSubscriptionCancelled = true
      }
    }

    // F7: if an extra-seat member leaves voluntarily, release/reuse the paid seat until period end.
    let extraSeatMetadata: Record<string, unknown> = {}
    if (membership.seat_type === 'extra') {
      const { data: allMembers = [] } = await supabase
        .from('family_members')
        .select('id, role, seat_type')
        .eq('family_group_id', membership.family_group_id)
        .eq('status', 'active')

      const { data: pendingInvites = [] } = await supabase
        .from('family_invites')
        .select('id, seat_type')
        .eq('family_group_id', membership.family_group_id)
        .eq('status', 'pending')

      const { data: seatAddons = [] } = await supabase
        .from('family_seat_addons')
        .select('id, quantity, status, cancel_at_period_end, current_period_end')
        .eq('family_group_id', membership.family_group_id)
        .eq('status', 'active')

      const seatUsage = calculateSeatUsage({
        activeMembers: allMembers || [],
        pendingInvites: pendingInvites || [],
        familyGroup,
        seatAddons: seatAddons || [],
      })

      const extraSeatReuse = calculateExtraSeatReuseState(seatUsage)

      if (extraSeatReuse.surplusExtraSeats > 0) {
        const { error: updateAddonError } = await supabase
          .from('family_seat_addons')
          .update({
            cancel_at_period_end: true,
            updated_at: now,
          })
          .eq('family_group_id', membership.family_group_id)
          .eq('status', 'active')

        if (updateAddonError) {
          console.warn('[family-member-leave] Failed to mark surplus add-ons for period-end cancellation:', updateAddonError)
        }
      }

      extraSeatMetadata = {
        requiredExtraSeats: extraSeatReuse.requiredExtraSeats,
        paidActiveExtraSeats: extraSeatReuse.paidActiveExtraSeats,
        reusableExtraSeats: extraSeatReuse.reusableExtraSeats,
        surplusSeatsScheduledToEnd: extraSeatReuse.surplusExtraSeats,
        currentPeriodEnd: extraSeatReuse.currentPeriodEnd,
      }
    }

    // Invalidate caches for the member
    try {
      await invalidateCache(`subscriptions:${user.id}`)
    } catch (e) {
      console.warn('[family-member-leave] Cache invalidation error:', e)
    }

    // Revalidate Next.js tags
    revalidateTag(`subscriptions:${user.id}`, 'max')
    revalidateTag('profile', 'max')

    // Send non-blocking notifications/emails (do not block leave on delivery failure)
    try {
      await notifyFamilyMemberLeft(
        familyGroup.owner_user_id,
        memberProfile?.full_name || memberEmail || 'Family member',
        memberEmail,
        membership.family_group_id
      )
    } catch (notificationError) {
      console.warn('[family-member-leave] Notification warning:', notificationError)
    }

    try {
      const { sendFamilyMemberLeftEmail } = await import('@/lib/email/family-member-left-email')
      await sendFamilyMemberLeftEmail({
        memberEmail,
        memberName: memberProfile?.full_name || 'Family member',
        ownerUserId: familyGroup.owner_user_id,
      })
    } catch (e) {
      console.warn('[family-member-leave] Email send error:', e)
      // Do not throw - leave succeeds even if email fails
    }

    return NextResponse.json({
      success: true,
      profileDowngraded,
      coveredSubscriptionCancelled,
      removedSeatType: membership.seat_type,
      ...extraSeatMetadata,
    })
  } catch (error) {
    console.error('[family-member-leave] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to leave Family'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
