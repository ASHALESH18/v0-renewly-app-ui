'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'
import { calculateSeatUsage } from '@/lib/family/family-seat-utils'

/**
 * POST /api/family/extra-seat/cancel
 * F7.2: Owner cancels paid extra seat add-ons (unused or in-use)
 * 
 * Marks family_seat_addons for scheduled cancellation:
 * - Unused extra seats: cancel immediately (availablePaidExtraSeats > 0)
 * - In-use extra seats: schedule cancellation at period end (cancel_at_period_end=true)
 * 
 * Returns scenario and member info for UI display
 */
export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { familyGroupId, quantity = 1 } = body

    if (!familyGroupId || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid request: familyGroupId and quantity required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[extra-seat-cancel] Missing Supabase env vars')
      return NextResponse.json({ error: 'Service misconfigured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify ownership
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, status, current_period_end')
      .eq('id', familyGroupId)
      .eq('owner_user_id', user.id)
      .eq('status', 'active')
      .single()

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found or not owned by user' },
        { status: 404 }
      )
    }

    // F7.2: Fetch all data needed to calculate seat usage and affected member
    const [
      { data: members = [] },
      { data: pendingInvites = [] },
      { data: seatAddons = [] },
    ] = await Promise.all([
      supabase
        .from('family_members')
        .select('id, user_id, email, role, seat_type, status, joined_at')
        .eq('family_group_id', familyGroupId)
        .eq('status', 'active'),
      supabase
        .from('family_invites')
        .select('id, invited_email, status, seat_type')
        .eq('family_group_id', familyGroupId)
        .eq('status', 'pending'),
      supabase
        .from('family_seat_addons')
        .select('id, quantity, status, cancel_at_period_end, current_period_end')
        .eq('family_group_id', familyGroupId)
        .eq('status', 'active'),
    ])

    // Calculate current seat usage
    const seatUsage = calculateSeatUsage({
      activeMembers: members,
      pendingInvites,
      familyGroup,
      seatAddons,
    })

    // F7.2: Determine scenario (unused or in-use)
    const availablePaidExtraSeats = seatUsage.paidActiveExtraSeats - seatUsage.activeExtraMembers
    const isUnused = availablePaidExtraSeats >= quantity
    let affectedMemberInfo = null
    let periodEndDate = null

    console.log('[v0] F7.2: Cancel request', {
      quantity,
      paidActiveExtraSeats: seatUsage.paidActiveExtraSeats,
      activeExtraMembers: seatUsage.activeExtraMembers,
      availablePaidExtraSeats,
      isUnused,
    })

    // F7.2: For in-use scenario, find which member is using the seat being cancelled
    if (!isUnused && seatUsage.activeExtraMembers > 0) {
      // Find extra members by their seat_type
      const extraMembers = (members || []).filter(m => m.seat_type === 'extra' && m.status === 'active')
      if (extraMembers.length > 0) {
        // Get the most recently added extra member
        const newestExtraMember = extraMembers.sort(
          (a, b) => new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime()
        )[0]
        
        affectedMemberInfo = {
          name: newestExtraMember.email || 'Unknown',
          email: newestExtraMember.email,
        }
      }
    }

    // F7.2: Get period end date from addon for scheduled cancellation message
    const activeCancelableAddon = (seatAddons || [])
      .filter(a => !a.cancel_at_period_end && a.quantity > 0)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      [0]

    if (!activeCancelableAddon) {
      return NextResponse.json(
        { error: 'No active seat addon found to cancel' },
        { status: 409 }
      )
    }

    periodEndDate = activeCancelableAddon.current_period_end || familyGroup.current_period_end

    // F7.2C: Keep quantity unchanged until lifecycle processor runs at period_end
    // Only set cancel_at_period_end flag; don't reduce quantity now
    // This keeps the extra seat active until the period ends
    
    // Check if already scheduled for cancellation - if so, this is idempotent
    if (activeCancelableAddon.cancel_at_period_end) {
      console.log('[v0] F7.2C: Addon already scheduled for cancellation - idempotent', {
        addonId: activeCancelableAddon.id,
      })
      return NextResponse.json(
        {
          message: 'Extra seat cancellation already scheduled',
          alreadyScheduled: true,
          scenario: isUnused ? 'unused' : 'in_use',
          periodEndDate,
          affectedMember: affectedMemberInfo,
          seatUsage,
        },
        { status: 200 }
      )
    }

    // F7.2C: Only update cancel_at_period_end flag - DO NOT reduce quantity
    // Quantity stays the same, lifecycle processor will remove the addon row when period ends
    const { error: updateError } = await supabase
      .from('family_seat_addons')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeCancelableAddon.id)

    if (updateError) {
      console.error('[extra-seat-cancel] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update seat addon' },
        { status: 500 }
      )
    }

    // F7.2: Trigger Renewly subscription resync
    try {
      await syncRenewlyBillingSubscriptionForPlan({
        userId: user.id,
        email: user.email || '',
        plan: 'family',
        currentPeriodEnd: familyGroup.current_period_end,
      })
    } catch (syncError) {
      console.error('[extra-seat-cancel] Renewly sync error:', syncError)
      // Don't fail the cancel if sync fails - it will resync on next Dashboard load
    }

    console.log('[v0] F7.2: Cancellation scheduled', {
      scenario: isUnused ? 'unused' : 'in_use',
      affectedMemberInfo,
      periodEndDate,
    })

    // Return with scenario info for UI
    return NextResponse.json(
      {
        message: isUnused 
          ? 'Unused extra seat cancelled successfully'
          : 'Extra seat cancellation scheduled at period end',
        scenario: isUnused ? 'unused' : 'in_use',
        affectedMember: affectedMemberInfo,
        periodEndDate,
        cancelledQuantity: quantity,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[extra-seat-cancel] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
