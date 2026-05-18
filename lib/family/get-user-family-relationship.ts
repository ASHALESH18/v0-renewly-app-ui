import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Determine the user's real Family relationship from relational state, not profiles.plan.
 *
 * Important: Family owners and Family members can both have profiles.plan = 'family'.
 * Therefore profile.plan must never be used to decide whether a user is the billing owner.
 */
export type FamilyRelationship = 'owner' | 'member' | 'none'

export interface FamilyRelationshipInfo {
  relationship: FamilyRelationship
  familyGroupId?: string
  ownerUserId?: string
  currentPeriodEnd?: string | null
  membershipId?: string
  seatType?: string | null
}

type SupabaseServiceClient = ReturnType<typeof createClient>

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getOwnedGroup(supabase: SupabaseServiceClient, userId: string) {
  const { data, error } = await supabase
    .from('family_groups')
    .select('id, owner_user_id, current_period_end, status, created_at')
    .eq('owner_user_id', userId)
    .in('status', ['active', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[family-relationship] Owner query error:', error)
  }

  return data || null
}

async function getActiveMemberRow(supabase: SupabaseServiceClient, userId: string) {
  const { data, error } = await supabase
    .from('family_members')
    .select(`
      id,
      family_group_id,
      seat_type,
      role,
      joined_at,
      family_groups (
        id,
        owner_user_id,
        status,
        current_period_end
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .eq('role', 'member')
    .order('joined_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    console.error('[family-relationship] Member query error:', error)
  }

  const familyGroup = data ? (data.family_groups as any) : null
  if (!data || !familyGroup || !['active', 'past_due'].includes(familyGroup.status)) {
    return null
  }

  return data
}

async function ownedGroupHasRealOwnerUsage(
  supabase: SupabaseServiceClient,
  familyGroupId: string
): Promise<boolean> {
  const [membersResult, invitesResult, addonsResult] = await Promise.all([
    supabase
      .from('family_members')
      .select('id', { count: 'exact', head: true })
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')
      .neq('role', 'owner'),
    supabase
      .from('family_invites')
      .select('id', { count: 'exact', head: true })
      .eq('family_group_id', familyGroupId)
      .eq('status', 'pending'),
    supabase
      .from('family_seat_addons')
      .select('id', { count: 'exact', head: true })
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active'),
  ])

  const activeNonOwnerMembers = membersResult.count || 0
  const pendingInvites = invitesResult.count || 0
  const activeAddons = addonsResult.count || 0

  return activeNonOwnerMembers > 0 || pendingInvites > 0 || activeAddons > 0
}

/**
 * A user can temporarily have both:
 * - an active covered member row in another owner's Family, and
 * - an orphan active owner group created by older profile.plan based sync.
 *
 * In that conflict, treat the user as the covered member unless the owned group has
 * real owner usage. Real upgrades should remove the previous member row in the
 * purchase/QA path before this relationship check runs.
 */
export async function getUserFamilyRelationship(
  userId: string
): Promise<FamilyRelationshipInfo> {
  const supabase = getSupabaseClient()

  try {
    const [ownedGroup, membership] = await Promise.all([
      getOwnedGroup(supabase, userId),
      getActiveMemberRow(supabase, userId),
    ])

    if (ownedGroup && membership) {
      const ownedGroupIsReal = await ownedGroupHasRealOwnerUsage(supabase, ownedGroup.id)

      if (ownedGroupIsReal) {
        return {
          relationship: 'owner',
          familyGroupId: ownedGroup.id,
          ownerUserId: ownedGroup.owner_user_id,
          currentPeriodEnd: ownedGroup.current_period_end,
        }
      }

      const memberFamilyGroup = (membership.family_groups as any)
      return {
        relationship: 'member',
        familyGroupId: membership.family_group_id,
        ownerUserId: memberFamilyGroup?.owner_user_id,
        membershipId: membership.id,
        seatType: membership.seat_type,
        currentPeriodEnd: memberFamilyGroup?.current_period_end,
      }
    }

    if (ownedGroup) {
      return {
        relationship: 'owner',
        familyGroupId: ownedGroup.id,
        ownerUserId: ownedGroup.owner_user_id,
        currentPeriodEnd: ownedGroup.current_period_end,
      }
    }

    if (membership) {
      const memberFamilyGroup = (membership.family_groups as any)
      return {
        relationship: 'member',
        familyGroupId: membership.family_group_id,
        ownerUserId: memberFamilyGroup?.owner_user_id,
        membershipId: membership.id,
        seatType: membership.seat_type,
        currentPeriodEnd: memberFamilyGroup?.current_period_end,
      }
    }

    return { relationship: 'none' }
  } catch (error) {
    console.error('[family-relationship] Error:', error)
    return { relationship: 'none' }
  }
}
