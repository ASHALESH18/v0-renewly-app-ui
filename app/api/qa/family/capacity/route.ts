import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateSeatUsage } from '@/lib/family/family-seat-utils'
import { calculateUnifiedFamilyCapacity, clampDisplayBilling } from '@/lib/family/family-capacity-source-of-truth'

/**
 * Combo 3B Part F: QA/Debug endpoint for family capacity calculations
 * 
 * GET /api/qa/family/capacity?familyGroupId=...
 * 
 * Preview/dev only. Read-only, no mutations.
 * Returns detailed capacity state for QA verification.
 */

function isPreviewOrDev(): boolean {
  const vercelEnv = process.env.VERCEL_ENV || 'development'
  return vercelEnv === 'preview' || vercelEnv === 'development'
}

export async function GET(request: NextRequest) {
  try {
    if (!isPreviewOrDev()) {
      return NextResponse.json(
        { error: 'QA endpoints only available in preview/development' },
        { status: 403 }
      )
    }

    const familyGroupId = request.nextUrl.searchParams.get('familyGroupId')
    if (!familyGroupId) {
      return NextResponse.json(
        { error: 'familyGroupId query parameter required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch family group
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('id', familyGroupId)
      .single()

    if (groupError || !familyGroup) {
      return NextResponse.json(
        { error: 'Family group not found' },
        { status: 404 }
      )
    }

    // Fetch active members
    const { data: activeMembers, error: membersError } = await supabase
      .from('family_members')
      .select('id, role, seat_type, status')
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')

    if (membersError) {
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Fetch pending invites (non-expired)
    const { data: allInvites, error: invitesError } = await supabase
      .from('family_invites')
      .select('id, seat_type, status, expires_at')
      .eq('family_group_id', familyGroupId)

    if (invitesError) {
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    const now = new Date()
    const pendingInvites = (allInvites || []).filter(inv => {
      if (inv.status !== 'pending') return false
      const expiresAt = new Date(inv.expires_at)
      return expiresAt > now
    })

    // Fetch seat addons
    const { data: seatAddons, error: addonsError } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroupId)

    if (addonsError) {
      return NextResponse.json(
        { error: 'Failed to fetch seat addons' },
        { status: 500 }
      )
    }

    // Calculate seat usage using existing utility
    const seatUsage = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup,
      seatAddons: seatAddons || [],
    })

    // Calculate unified capacity using new source of truth
    const capacity = calculateUnifiedFamilyCapacity({
      seatUsage,
      seatAddons: seatAddons || [],
    })

    // Clamp for safety
    const clamped = clampDisplayBilling(capacity)

    // Check for warnings
    const warnings: string[] = []
    if (clamped.emergencyOverflow) {
      warnings.push('EMERGENCY: Extra seat overflow detected and clamped')
    }
    if (clamped.hasUnpaidReserved) {
      warnings.push(`WARNING: ${clamped.activeExtraMembers + clamped.pendingExtraInvites} pending extra members but only ${clamped.activePaidExtraSeatQuantity} paid seats`)
    }
    if (clamped.currentMonthlyTotal > 695) {
      warnings.push(`ERROR: Current monthly total (₹${clamped.currentMonthlyTotal}) exceeds max (₹695)`)
    }
    if (clamped.isAtMaxCapacity) {
      warnings.push('WARNING: Family at maximum capacity (8 invited members)')
    }

    return NextResponse.json({
      success: true,
      familyGroupId,
      familyGroup: {
        id: familyGroup.id,
        owner_user_id: familyGroup.owner_user_id,
        status: familyGroup.status,
        current_period_end: familyGroup.current_period_end,
      },
      capacity: clamped,
      seatUsage,
      members: {
        activeCount: activeMembers?.length || 0,
        active: activeMembers || [],
      },
      invites: {
        totalCount: allInvites?.length || 0,
        pendingCount: pendingInvites?.length || 0,
        pending: pendingInvites || [],
      },
      addons: {
        count: seatAddons?.length || 0,
        list: seatAddons || [],
      },
      warnings,
      qaChecks: {
        ownerPlus4IncludedShow299: capacity.activeIncludedMembers === 4 && capacity.currentBillableExtraSeats === 0 && clamped.currentMonthlyTotal === 299,
        ownerPlusOneExtraShow398: capacity.activeExtraMembers === 1 && capacity.currentBillableExtraSeats >= 1 && clamped.currentMonthlyTotal === 398,
        ownerPlusFourExtraShow695: capacity.activeExtraMembers === 4 && capacity.currentBillableExtraSeats === 4 && clamped.currentMonthlyTotal === 695,
        neverShowsPlus5: capacity.totalInvitedMembers <= 8,
        neverShowsOver694: clamped.currentMonthlyTotal <= 695,
      },
    }, { status: 200 })
  } catch (error) {
    console.error('[qa/family/capacity] Error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
