'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { FAMILY_INCLUDED_MEMBER_COUNT } from '@/lib/family/family-config'

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

    const userEmail = profile?.email || user.email || ''
    const maxMembers = FAMILY_INCLUDED_MEMBER_COUNT

    // Default safe response for non-Family users
    const defaultResponse = {
      profilePlan: profile?.plan || 'free',
      isFamilyOwner: false,
      familyGroup: null,
      familyGroupId: null,
      membership: null,
      removedMembership: null,
      pendingInvite: null,
      members: [],
      invites: [],
      maxMembers,
      currentMemberCount: 0,
      availableSeats: 0,
    }

    // Fetch active family group where user is owner
    const { data: ownerGroup, error: ownerGroupError } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, extra_member_price_inr, current_period_end')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    // Fetch active family membership where user is member
    const { data: membership, error: membershipError } = await supabase
      .from('family_members')
      .select('id, family_group_id, role, seat_type, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Fetch removed membership (lightweight check for recently removed members)
    const { data: removedMembership, error: removedMembershipError } = await supabase
      .from('family_members')
      .select('id, family_group_id, role, removed_at')
      .eq('user_id', user.id)
      .eq('status', 'removed')
      .order('removed_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch pending invite by signed-in email (case-insensitive match)
    const { data: pendingInviteData } = await supabase
      .from('family_invites')
      .select('id, invited_email, status, expires_at, seat_type')
      .ilike('invited_email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', 'now()')
      .single()

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
        .eq('seat_type', 'included') // Only show included seat invites

      if (invitesError) {
        console.error('[family-status] Invites fetch error:', invitesError)
      }

      // Calculate capacity
      const activeMembers = (members || []).filter(m => m.status === 'active')
      const pendingIncludedInvites = (invites || []).filter(i => i.status === 'pending' && i.seat_type === 'included')
      const currentMemberCount = activeMembers.length
      const includedInviteCount = pendingIncludedInvites.length
      const availableSeats = Math.max(0, maxMembers - currentMemberCount - includedInviteCount)

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
        membership: null, // Owner is not a "member"
        pendingInvite: null, // Owner doesn't have pending invites
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
      })
    }

    // If member, return membership info
    if (membership) {
      return NextResponse.json({
        ...defaultResponse,
        membership: {
          id: membership.id,
          familyGroupId: membership.family_group_id,
          role: membership.role,
          seatType: membership.seat_type,
          joinedAt: membership.joined_at,
        },
      })
    }

    // If removed from family, return removed membership state
    if (removedMembership && removedMembershipError?.code !== 'PGRST116') {
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

    // If has pending invite, return it
    if (pendingInviteData) {
      return NextResponse.json({
        ...defaultResponse,
        pendingInvite: {
          id: pendingInviteData.id,
          invitedEmail: pendingInviteData.invited_email,
          expiresAt: pendingInviteData.expires_at,
          seatType: pendingInviteData.seat_type,
        },
      })
    }

    // Default: return safe empty response
    return NextResponse.json(defaultResponse)
  } catch (error) {
    console.error('[family-status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
