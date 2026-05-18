'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { FAMILY_INCLUDED_MEMBER_COUNT, FAMILY_EXTRA_MEMBER_PRICE_INR } from '@/lib/family/family-config'
import { calculateSeatUsage, calculateExtraSeatReuseState } from '@/lib/family/family-seat-utils'
import { calculateFamilyBillingDisplay, getFamilyBillingCurrency } from '@/lib/billing/family-billing-utils'
import { getPendingFamilyInviteForUserEmail } from '@/lib/family/get-pending-family-invite'

/**
 * GET /api/family/status
 * 
 * Returns comprehensive family status for signed-in user:
 * - Profile plan
 * - Family owner status with members and invites (for owners)
 * - Family membership (if member)
 * - Pending invite (if invited)
 * 
 * Returns safe empty status for non-Family users (no 403).
 */
export async function GET() {
  try {
    // Initialize Supabase client inside the function (not at module level)
    // These env vars are only available at runtime, not during build
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[family-status] Missing Supabase env vars')
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

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan, email')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[family-status] Profile fetch error:', profileError)
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      )
    }

    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('currency_code')
      .eq('user_id', user.id)
      .maybeSingle()

    const userEmail = profile?.email || user.email || ''
    const maxMembers = FAMILY_INCLUDED_MEMBER_COUNT

    // Default safe response for non-Family users
    const defaultResponse = {
      profilePlan: profile?.plan || 'free',
      isFamilyOwner: false,
      familyGroup: null,
      familyGroupId: null,
      familyOwner: null,
      membership: null,
      removedMembership: null,
      pendingInvite: null,
      members: [],
      invites: [],
      maxMembers,
      currentMemberCount: 0,
      availableSeats: 0,
    }

    // S5B.3: Parallel fetch of user states (not owner-only data yet)
    // Evaluate states in this order: owner, member, pending, removed, free
    const [ownerResult, membershipResult, removedResult, pendingInviteData] = await Promise.all([
      // Fetch active family group where user is owner
      supabase
        .from('family_groups')
        .select('id, status, included_member_limit, extra_member_price_inr, current_period_end, scheduled_action, scheduled_action_reason')
        .eq('owner_user_id', user.id)
        .in('status', ['active', 'past_due'])
        .maybeSingle(),
      // Fetch active family membership where user is member
      supabase
        .from('family_members')
        .select('id, family_group_id, role, seat_type, joined_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('role', 'member')
        .maybeSingle(),
      // Fetch removed membership (lightweight check for recently removed members)
      supabase
        .from('family_members')
        .select('id, family_group_id, role, removed_at')
        .eq('user_id', user.id)
        .eq('status', 'removed')
        .order('removed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Fetch pending invite using shared helper (source-of-truth)
      getPendingFamilyInviteForUserEmail(supabase, userEmail),
    ])

    const ownerGroup = ownerResult.data
    const ownerGroupError = ownerResult.error
    const membership = membershipResult.data
    const membershipError = membershipResult.error
    const removedMembership = removedResult.data
    const removedMembershipError = removedResult.error

    // If owner, fetch active members and pending invites
    if (ownerGroup) {
      const { data: members = [], error: membersError } = await supabase
        .from('family_members')
        .select('id, user_id, email, role, seat_type, status, joined_at')
        .eq('family_group_id', ownerGroup.id)
        .eq('status', 'active')
        .not('role', 'eq', 'owner') // Exclude owner from member list

      if (membersError) {
        console.error('[family-status] Members fetch error:', membersError)
      }

      const { data: invites = [], error: invitesError } = await supabase
        .from('family_invites')
        .select('id, invited_email, status, expires_at, seat_type')
        .eq('family_group_id', ownerGroup.id)
        // Get both included and extra invites (don't filter by seat_type)
        .in('status', ['pending', 'cancelled', 'expired', 'accepted'])

      if (invitesError) {
        console.error('[family-status] Invites fetch error:', invitesError)
      }

      // Fetch family seat add-ons before calculating seat usage.
      const { data: seatAddons = [], error: seatsError } = await supabase
        .from('family_seat_addons')
        .select('id, quantity, status, cancel_at_period_end, current_period_end')
        .eq('family_group_id', ownerGroup.id)
        .eq('status', 'active')

      if (seatsError) {
        console.error('[family-status] Seat addons fetch error:', seatsError)
      }

      // Calculate detailed seat usage - only pending invites reserve seats.
      const pendingInvitesForSeatUsage = (invites || []).filter((i) => i.status === 'pending')

      const seatUsage = calculateSeatUsage({
        activeMembers: (members || []),
        pendingInvites: pendingInvitesForSeatUsage,
        familyGroup: ownerGroup,
        seatAddons: seatAddons || [],
      })

      // Calculate extra-seat reuse state (F7)
      const extraSeatReuseState = calculateExtraSeatReuseState(seatUsage)

      const totalActiveExtraSeats = seatUsage.paidActiveExtraSeats
      const extraSeatsScheduledToEnd = seatUsage.extraSeatsEndingAtPeriodEnd

      // Separate active members for display
      const activeMembers = (members || []).filter(m => m.status === 'active')
      const currentMemberCount = activeMembers.length
      const pendingIncludedInvites = (invites || []).filter(i => i.status === 'pending' && i.seat_type === 'included')
      const includedInviteCount = pendingIncludedInvites.length
      const availableSeats = Math.max(0, maxMembers - currentMemberCount - includedInviteCount)

      // Blocker #6: Calculate Plan & Billing display (F6C)
      const userCurrency = userSettings?.currency_code || 'INR'
      const billingCurrency = getFamilyBillingCurrency(userCurrency)
      const billingDisplay = calculateFamilyBillingDisplay({
        activeMemberCount: currentMemberCount,
        activeExtraMembers: totalActiveExtraSeats,
        pendingIncludedInvites: includedInviteCount,
        pendingExtraInvites: seatUsage.pendingExtraInvites,
        currency: billingCurrency,
      })

      return NextResponse.json({
        profilePlan: profile?.plan || 'free',
        isFamilyOwner: true,
        familyGroup: {
          id: ownerGroup.id,
          status: ownerGroup.status,
          currentPeriodEnd: ownerGroup.current_period_end,
          includedMemberLimit: ownerGroup.included_member_limit,
        },
        familyGroupId: ownerGroup.id,
        familyOwner: {
          userId: user.id,
          email: userEmail,
        },
        membership: null,
        pendingInvite: null,
        members: (activeMembers || []).map(m => ({
          id: m.id,
          userId: m.user_id,
          email: m.email,
          role: m.role,
          seatType: m.seat_type,
          status: m.status,
          joinedAt: m.joined_at,
        })),
        invites: (invites || []).map(i => ({
          id: i.id,
          inviteId: i.id,
          invitedEmail: i.invited_email,
          status: i.status,
          expiresAt: i.expires_at,
          seatType: i.seat_type,
        })),
        maxMembers,
        currentMemberCount,
        availableSeats,
        // F6A: Detailed seat usage for extra-seat UI
        seatUsage: {
          includedLimit: seatUsage.includedLimit,
          includedSeatsUsed: seatUsage.includedSeatsUsed,
          availableIncludedSeats: seatUsage.availableIncludedSeats,
          extraSeatCount: seatUsage.extraSeatCount,
          paidActiveExtraSeats: seatUsage.paidActiveExtraSeats,
          activeExtraMembers: seatUsage.activeExtraMembers,
          pendingExtraInvites: seatUsage.pendingExtraInvites,
          extraSeatPriceINR: FAMILY_EXTRA_MEMBER_PRICE_INR,
        },
        // F7: Extra-seat reuse and surplus state
        extraSeatReuse: {
          requiredExtraSeats: extraSeatReuseState.requiredExtraSeats,
          paidActiveExtraSeats: totalActiveExtraSeats,
          reusableExtraSeats: extraSeatReuseState.reusableExtraSeats,
          surplusExtraSeats: extraSeatReuseState.surplusExtraSeats,
          extraSeatsScheduledToEnd,
        },
        // F7.2A: Seat add-ons with scheduled cancellation state
        seatAddons: (seatAddons || []).map(addon => ({
          id: addon.id,
          quantity: addon.quantity,
          status: addon.status,
          cancelAtPeriodEnd: addon.cancel_at_period_end,
          currentPeriodEnd: addon.current_period_end,
        })),
        // F8-lite: Lifecycle scheduling
        lifecycle: {
          scheduledAction: ownerGroup.scheduled_action,
          scheduledActionReason: ownerGroup.scheduled_action_reason,
          scheduledFor: ownerGroup.current_period_end,
          canScheduleNewInvites: ownerGroup.scheduled_action !== 'cancel_at_period_end',
        },
        // F7.2B: Billing metadata for Dashboard and Settings display
        billingMetadata: {
          currentMonthlyTotal: 299 + (seatUsage.paidActiveExtraSeats * FAMILY_EXTRA_MEMBER_PRICE_INR),
          nextCycleMonthlyTotal: 299 + (Math.max(0, seatUsage.paidActiveExtraSeats - extraSeatsScheduledToEnd) * FAMILY_EXTRA_MEMBER_PRICE_INR),
          extraSeatCount: seatUsage.paidActiveExtraSeats,
          scheduledCancelExtraSeatCount: extraSeatsScheduledToEnd,
          scheduledCancelDate: seatAddons
            ?.filter((a: any) => a.cancel_at_period_end)
            .sort((a: any, b: any) => new Date(b.current_period_end || 0).getTime() - new Date(a.current_period_end || 0).getTime())
            ?.[0]?.current_period_end || ownerGroup.current_period_end,
        },
        billingDisplay,
      })
    }

    // If member, return membership info with family owner details
    if (membership) {
      let familyOwner: { userId: string; email: string | null } | null = null
      let memberFamilyGroup: any = null

      const { data: groupData, error: memberGroupError } = await supabase
        .from('family_groups')
        .select('id, owner_user_id, status, current_period_end')
        .eq('id', membership.family_group_id)
        .in('status', ['active', 'past_due'])
        .maybeSingle()

      if (memberGroupError) {
        console.error('[family-status] Member family group fetch error:', memberGroupError)
      }

      memberFamilyGroup = groupData

      if (memberFamilyGroup?.owner_user_id) {
        const { data: ownerProfile, error: ownerProfileError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('id', memberFamilyGroup.owner_user_id)
          .maybeSingle()

        if (ownerProfileError) {
          console.error('[family-status] Family owner profile fetch error:', ownerProfileError)
        }

        familyOwner = {
          userId: memberFamilyGroup.owner_user_id,
          email: ownerProfile?.email || null,
        }
      }

      return NextResponse.json({
        ...defaultResponse,
        familyGroup: memberFamilyGroup
          ? {
            id: memberFamilyGroup.id,
            status: memberFamilyGroup.status,
            currentPeriodEnd: memberFamilyGroup.current_period_end,
          }
          : null,
        familyGroupId: membership.family_group_id,
        familyOwner,
        membership: {
          id: membership.id,
          familyGroupId: membership.family_group_id,
          role: membership.role,
          seatType: membership.seat_type,
          joinedAt: membership.joined_at,
        },
        // F7.2C: Add scheduled cancellation info for extra members
        scheduledExtraSeatCancellation:
          membership.seat_type === 'extra' && seatAddons?.some((a: any) => a.cancel_at_period_end)
            ? {
              activeUntil: seatAddons
                ?.filter((a: any) => a.cancel_at_period_end)
                .sort((a: any, b: any) => new Date(b.current_period_end || 0).getTime() - new Date(a.current_period_end || 0).getTime())
                ?.[0]?.current_period_end || memberFamilyGroup?.current_period_end,
              message: 'This extra seat will be removed after the current billing period',
            }
            : null,
      })
    }

    // Check pending invite BEFORE removed membership (S5B.2 precedence fix)
    // If has pending invite, return it with family owner details
    // Helper already validated family group and fetched owner
    if (pendingInviteData) {
      return NextResponse.json({
        ...defaultResponse,
        familyGroupId: pendingInviteData.familyGroupId,
        familyOwner: {
          userId: pendingInviteData.familyOwner.userId,
          email: pendingInviteData.familyOwner.email,
        },
        pendingInvite: {
          id: pendingInviteData.id,
          invitedEmail: pendingInviteData.invitedEmail,
          expiresAt: pendingInviteData.expiresAt,
          seatType: pendingInviteData.seatType,
        },
      })
    }

    // If removed from family, return removed membership state
    if (removedMembership) {
      return NextResponse.json({
        ...defaultResponse,
        removedMembership: {
          id: removedMembership.id,
          familyGroupId: removedMembership.family_group_id,
          role: removedMembership.role,
          removedAt: removedMembership.removed_at,
          status: 'removed',
        },
      })
    }

    // Default: return safe empty response
    console.info('[family-status] No family relationship found', { userId: user.id })
    return NextResponse.json(defaultResponse)
  } catch (error) {
    console.error('[family-status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
