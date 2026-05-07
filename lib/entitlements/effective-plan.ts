import { createClient } from '@supabase/supabase-js'
import type { PlanType } from '@/lib/plan-capabilities'

export type EffectivePlan = 'free' | 'pro' | 'family' | 'enterprise'

export interface EffectiveEntitlement {
  userId: string
  profilePlan: EffectivePlan
  effectivePlan: EffectivePlan
  source:
    | 'profile_free'
    | 'profile_pro'
    | 'profile_enterprise'
    | 'family_owner'
    | 'family_member'
    | 'independent_paid_subscription'
    | 'removed_family_member'
  isFamilyOwner: boolean
  isFamilyMember: boolean
  familyGroupId: string | null
  familyGroupStatus: 'active' | 'past_due' | 'cancelled' | null
  membershipId: string | null
  membershipStatus: 'active' | 'removed' | null
  removedFromFamily: boolean
  hasIndependentPaidPlan: boolean
}

/**
 * Get Supabase service client for entitlement resolution
 * Must be server-side only
 */
function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

/**
 * Resolve the effective entitlement for a user
 * 
 * Logic:
 * 1. Enterprise profile always effective enterprise
 * 2. Active family owner group gives family
 * 3. Active family member in active/past_due group gives family
 * 4. Independent paid family/pro subscription gives family/pro
 * 5. Profile pro gives pro
 * 6. Removed family member with no independent paid plan gives free
 * 7. Profile family without active group/membership should not give family; treat as stale
 * 8. Otherwise free
 */
export async function resolveEffectiveEntitlement(userId: string): Promise<EffectiveEntitlement> {
  try {
    const supabase = getSupabaseServiceClient()

    // 1. Fetch profile plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, plan')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.warn('[entitlements] Profile fetch error:', profileError)
      throw new Error('Failed to fetch profile')
    }

    const profilePlan = (profile?.plan || 'free') as EffectivePlan
    const now = new Date().toISOString()

    // Initialize result with defaults
    const result: EffectiveEntitlement = {
      userId,
      profilePlan,
      effectivePlan: 'free',
      source: 'profile_free',
      isFamilyOwner: false,
      isFamilyMember: false,
      familyGroupId: null,
      familyGroupStatus: null,
      membershipId: null,
      membershipStatus: null,
      removedFromFamily: false,
      hasIndependentPaidPlan: false,
    }

    // Enterprise always has enterprise access
    if (profilePlan === 'enterprise') {
      result.effectivePlan = 'enterprise'
      result.source = 'profile_enterprise'
      return result
    }

    // 2. Fetch active family group where user is owner
    const { data: ownerGroup } = await supabase
      .from('family_groups')
      .select('id, status')
      .eq('owner_user_id', userId)
      .in('status', ['active', 'past_due'])
      .single()

    if (ownerGroup) {
      result.isFamilyOwner = true
      result.familyGroupId = ownerGroup.id
      result.familyGroupStatus = ownerGroup.status as 'active' | 'past_due'
      result.effectivePlan = 'family'
      result.source = 'family_owner'
      return result
    }

    // 3. Fetch active family membership where user is member
    const { data: membership } = await supabase
      .from('family_members')
      .select('id, family_group_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (membership) {
      // 4. Fetch family group to verify it's active/past_due
      const { data: memberGroup } = await supabase
        .from('family_groups')
        .select('id, status')
        .eq('id', membership.family_group_id)
        .single()

      if (memberGroup && (memberGroup.status === 'active' || memberGroup.status === 'past_due')) {
        result.isFamilyMember = true
        result.membershipId = membership.id
        result.membershipStatus = 'active'
        result.familyGroupId = membership.family_group_id
        result.familyGroupStatus = memberGroup.status as 'active' | 'past_due'
        result.effectivePlan = 'family'
        result.source = 'family_member'
        return result
      }
    }

    // 5. Check for independent active paid Renewly subscription
    const { data: independentSubscription } = await supabase
      .from('subscriptions')
      .select('id, managed_plan')
      .eq('user_id', userId)
      .eq('is_system_managed', true)
      .eq('system_source', 'renewly_billing')
      .eq('status', 'active')
      .in('managed_plan', ['pro', 'family'])
      .or('covered_by_family.eq.false,covered_by_family.is.null')
      .single()

    if (independentSubscription) {
      result.hasIndependentPaidPlan = true
      result.effectivePlan = (independentSubscription.managed_plan || 'pro') as EffectivePlan
      result.source = 'independent_paid_subscription'
      return result
    }

    // 6. Check for removed family membership
    const { data: removedMembership } = await supabase
      .from('family_members')
      .select('id, status')
      .eq('user_id', userId)
      .eq('status', 'removed')
      .order('removed_at', { ascending: false })
      .limit(1)
      .single()

    if (removedMembership) {
      result.removedFromFamily = true
      result.membershipId = removedMembership.id
      result.membershipStatus = 'removed'
      result.effectivePlan = 'free'
      result.source = 'removed_family_member'
      return result
    }

    // 7. Profile plan evaluation
    // If profile says pro, honor it (user has purchased Pro plan)
    if (profilePlan === 'pro') {
      result.effectivePlan = 'pro'
      result.source = 'profile_pro'
      return result
    }

    // If profile says family but no active owner group, active membership, or independent paid plan,
    // treat as stale and return free
    if (profilePlan === 'family') {
      result.effectivePlan = 'free'
      result.source = 'removed_family_member'
      return result
    }

    // 8. Default to free
    result.effectivePlan = 'free'
    result.source = 'profile_free'
    return result
  } catch (error) {
    console.error('[entitlements] Error resolving effective entitlement:', error)
    // Return safe default
    return {
      userId,
      profilePlan: 'free',
      effectivePlan: 'free',
      source: 'profile_free',
      isFamilyOwner: false,
      isFamilyMember: false,
      familyGroupId: null,
      familyGroupStatus: null,
      membershipId: null,
      membershipStatus: null,
      removedFromFamily: false,
      hasIndependentPaidPlan: false,
    }
  }
}

/**
 * Get capabilities for an effective plan
 */
export async function getEffectiveCapabilities(userId: string) {
  const { getCapabilities } = await import('@/lib/plan-capabilities')
  const entitlement = await resolveEffectiveEntitlement(userId)
  return getCapabilities(entitlement.effectivePlan)
}
