import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * F7.2E-R: Determine a user's relationship to the Family plan system
 * Queries actual DB state (not profile.plan) to handle edge cases:
 * - Owner: Has active/past_due family_groups row (owner_user_id = user_id)
 * - Member: Has active family_members row (family_group_id exists)
 * - None: Neither owner nor member (standalone Renewly user)
 */
export type FamilyRelationship = 'owner' | 'member' | 'none'

export interface FamilyRelationshipInfo {
  relationship: FamilyRelationship
  familyGroupId?: string
  ownerUserId?: string
  currentPeriodEnd?: string
  membershipId?: string
  seatType?: string
}

export async function getUserFamilyRelationship(
  userId: string
): Promise<FamilyRelationshipInfo> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // F7.2E-R: Check if user owns an active/past_due family group
    const { data: ownedGroup, error: ownerError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, current_period_end, status')
      .eq('owner_user_id', userId)
      .in('status', ['active', 'past_due'])
      .maybeSingle()

    if (ownerError && ownerError.code !== 'PGRST116') {
      console.error('[family-relationship] Owner query error:', ownerError)
    }

    if (ownedGroup) {
      return {
        relationship: 'owner',
        familyGroupId: ownedGroup.id,
        ownerUserId: ownedGroup.owner_user_id,
        currentPeriodEnd: ownedGroup.current_period_end,
      }
    }

    // F7.2E-R: Check if user is an active member of a family group
    const { data: membership, error: memberError } = await supabase
      .from('family_members')
      .select('id, family_group_id, seat_type')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('[family-relationship] Member query error:', memberError)
    }

    if (membership) {
      // Get family group info for period end
      const { data: memberGroup } = await supabase
        .from('family_groups')
        .select('id, current_period_end')
        .eq('id', membership.family_group_id)
        .maybeSingle()

      return {
        relationship: 'member',
        familyGroupId: membership.family_group_id,
        membershipId: membership.id,
        seatType: membership.seat_type,
        currentPeriodEnd: memberGroup?.current_period_end,
      }
    }

    // F7.2E-R: User has no family relationship
    return { relationship: 'none' }
  } catch (error) {
    console.error('[family-relationship] Error:', error)
    return { relationship: 'none' }
  }
}
