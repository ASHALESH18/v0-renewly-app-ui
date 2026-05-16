'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { syncRenewlyBillingSubscriptionForPlan } from '@/lib/billing/renewly-subscription-sync'
import { calculateSeatUsage } from '@/lib/family/family-seat-utils'

/**
 * POST /api/family/extra-seat/cancel
 * F7: Owner cancels unused paid extra seats
 * 
 * Marks family_seat_addons for cancellation and triggers Renewly resync
 * Only allows cancellation if extra seats are unused (availablePaidExtraSeats > 0)
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
      .select('id, owner_user_id, status')
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

    // F7: Fetch all data needed to calculate available seats
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
        .select('id, quantity, status, cancel_at_period_end')
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

    // F7: Check if we have available (unused) paid seats to cancel
    const availablePaidExtraSeats = seatUsage.paidActiveExtraSeats - seatUsage.activeExtraMembers
    if (availablePaidExtraSeats < quantity) {
      return NextResponse.json(
        {
          error: 'Cannot cancel: not enough unused extra seats',
          available: availablePaidExtraSeats,
          requested: quantity,
        },
        { status: 409 }
      )
    }

    // F7: Mark seat addon for cancellation
    // Strategy: Mark the most recent addon with cancel_at_period_end=true
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

    // Reduce quantity or mark for full cancellation
    const newQuantity = activeCancelableAddon.quantity - quantity
    const { error: updateError } = await supabase
      .from('family_seat_addons')
      .update({
        quantity: Math.max(0, newQuantity),
        cancel_at_period_end: newQuantity === 0,
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

    // F7: Trigger Renewly subscription resync
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

    // Return updated seat usage with reduced paid seats
    const updatedSeatUsage = {
      ...seatUsage,
      paidActiveExtraSeats: Math.max(0, seatUsage.paidActiveExtraSeats - quantity),
    }

    return NextResponse.json(
      {
        message: 'Extra seat(s) cancelled successfully',
        seatUsage: updatedSeatUsage,
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
