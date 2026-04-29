'use server'

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * GET /api/family/status
 * 
 * Returns family status for signed-in user:
 * - Profile plan
 * - Family owner status
 * - Active family group (if owner)
 * - Family membership (if member)
 * - Pending invite (if invited)
 */
export async function GET() {
  try {
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

    // Fetch active family group where user is owner
    const { data: ownerGroup } = await supabase
      .from('family_groups')
      .select('id, status, included_member_limit, extra_member_price_inr, current_period_end')
      .eq('owner_user_id', user.id)
      .in('status', ['active', 'past_due'])
      .single()

    // Fetch active family membership where user is member
    const { data: membership } = await supabase
      .from('family_members')
      .select('id, family_group_id, role, seat_type, joined_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    // Fetch pending invite by signed-in email (case-insensitive match)
    const { data: pendingInvite } = await supabase
      .from('family_invites')
      .select('id, invited_email, status, expires_at')
      .ilike('invited_email', userEmail)
      .eq('status', 'pending')
      .gt('expires_at', 'now()')
      .single()

    return NextResponse.json({
      profilePlan: profile?.plan || 'free',
      isFamilyOwner: !!ownerGroup,
      familyGroup: ownerGroup ? {
        id: ownerGroup.id,
        status: ownerGroup.status,
        currentPeriodEnd: ownerGroup.current_period_end,
      } : null,
      membership: membership ? {
        id: membership.id,
        role: membership.role,
        seatType: membership.seat_type,
        joinedAt: membership.joined_at,
      } : null,
      pendingInvite: pendingInvite ? {
        id: pendingInvite.id,
        invitedEmail: pendingInvite.invited_email,
        expiresAt: pendingInvite.expires_at,
      } : null,
    })
  } catch (error) {
    console.error('[family-status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
