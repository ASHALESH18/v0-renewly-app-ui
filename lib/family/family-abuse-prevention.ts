/**
 * F10: Family Plan Abuse Prevention and Security Rules
 * 
 * This module documents and provides helpers for abuse/security rules.
 * All rules are enforced server-side. UI hiding is not sufficient.
 * 
 * Rules:
 * 1. Owner cannot invite self
 * 2. Duplicate pending invite is blocked
 * 3. Existing active member cannot be invited again
 * 4. Wrong signed-in email cannot accept invite (verified at accept time)
 * 5. One user should not be able to join multiple active families
 * 6. Removed member cannot keep Family entitlement
 * 7. Left member cannot keep Family entitlement
 * 8. Cancelled invite link cannot be accepted
 * 9. Expired invite link cannot be accepted
 * 10. Extra-seat payment intent cannot be reused for multiple invites
 * 11. Extra-seat finalize-payment must remain idempotent
 * 12. QA payment confirmation must only work in Preview/QA allowlisted mode
 * 13. Non-owner cannot remove members
 * 14. Non-owner cannot cancel/resend owner invites
 * 15. Owner cannot remove themselves using member remove route
 * 16. Family plan cancellation must not delete member personal accounts
 * 17. Family plan cancellation must not delete member personal subscriptions
 * 18. Family billing flows must not delete normal user-created subscriptions
 * 19. Managed Renewly Pro/Family cards remain display-only
 * 20. Normal subscription tracker edit/delete still works for user-created subscriptions
 */

import { createClient } from '@supabase/supabase-js'

/**
 * F10-1: Check owner cannot invite self
 */
export async function checkOwnerCannotInviteSelf(
  supabase: any,
  ownerId: string,
  invitedEmail: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: ownerProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', ownerId)
    .single()

  if (ownerProfile?.email?.toLowerCase() === invitedEmail.toLowerCase()) {
    return {
      valid: false,
      error: 'Cannot invite yourself',
    }
  }

  return { valid: true }
}

/**
 * F10-2: Check duplicate pending invite
 */
export async function checkNoDuplicatePendingInvite(
  supabase: any,
  familyGroupId: string,
  invitedEmail: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('family_invites')
    .select('id')
    .eq('family_group_id', familyGroupId)
    .ilike('invited_email', invitedEmail)
    .eq('status', 'pending')
    .single()

  if (existing) {
    return {
      valid: false,
      error: 'Invite already sent to this email',
    }
  }

  return { valid: true }
}

/**
 * F10-3: Check existing active member cannot be invited
 */
export async function checkNotAlreadyActiveMember(
  supabase: any,
  familyGroupId: string,
  invitedEmail: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_group_id', familyGroupId)
    .ilike('email', invitedEmail)
    .eq('status', 'active')
    .single()

  if (existing) {
    return {
      valid: false,
      error: 'This email is already a member of the family group',
    }
  }

  return { valid: true }
}

/**
 * F10-5: One user should not join multiple active families
 */
export async function checkUserNotInMultipleFamilies(
  supabase: any,
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: existingMembership } = await supabase
    .from('family_members')
    .select('family_group_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)

  if (existingMembership && existingMembership.length > 0) {
    return {
      valid: false,
      error: 'User is already a member of another family group',
    }
  }

  return { valid: true }
}

/**
 * F7-2: User cannot own multiple active families or be an owner while being a member
 * Prevents conflict: one user cannot be both owner and member across different families
 */
export async function checkUserNotOwnerOfOtherFamily(
  supabase: any,
  userId: string,
  excludeFamilyGroupId?: string
): Promise<{ valid: boolean; error?: string }> {
  // Check if user owns any active family group
  let query = supabase
    .from('family_groups')
    .select('id')
    .eq('owner_user_id', userId)
    .in('status', ['active', 'past_due'])

  // Optionally exclude a specific family group (for future use)
  if (excludeFamilyGroupId) {
    query = query.neq('id', excludeFamilyGroupId)
  }

  const { data: ownedFamilies } = await query.limit(1)

  if (ownedFamilies && ownedFamilies.length > 0) {
    return {
      valid: false,
      error: 'You already own an active Renewly Family plan. You cannot join another family.',
    }
  }

  return { valid: true }
}

/**
 * F10-13: Non-owner cannot remove members
 */
export function checkOwnerOnly(
  isOwner: boolean
): { valid: boolean; error?: string } {
  if (!isOwner) {
    return {
      valid: false,
      error: 'Only the family owner can perform this action',
    }
  }
  return { valid: true }
}

/**
 * F10-15: Owner cannot remove themselves
 */
export function checkNotRemovingOwner(
  memberId: string,
  memberRole: string
): { valid: boolean; error?: string } {
  if (memberRole === 'owner') {
    return {
      valid: false,
      error: 'Cannot remove the family owner using this route',
    }
  }
  return { valid: true }
}

/**
 * F10-19: Managed subscription remains display-only
 * Check if subscription is system-managed
 */
export function isManagedSubscription(
  subscription: any
): boolean {
  return (
    subscription?.is_system_managed === true &&
    (subscription?.managed_plan === 'family' || subscription?.managed_plan === 'pro')
  )
}

/**
 * F10-20: User-created subscriptions remain editable
 */
export function isUserCreatedSubscription(
  subscription: any
): boolean {
  return !isManagedSubscription(subscription)
}

/**
 * Resolve a profile by email. Missing profile is allowed for invites because
 * users can be invited before they sign up.
 */
async function getTargetProfileByEmail(supabase: any, targetEmail: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, plan')
    .ilike('email', targetEmail)
    .maybeSingle()

  if (error) {
    console.warn('[family-abuse] Target profile lookup warning:', error)
  }

  return data || null
}

async function getActiveOrPastDueFamilyIds(supabase: any, familyGroupIds: string[]) {
  const ids = Array.from(new Set((familyGroupIds || []).filter(Boolean)))
  if (ids.length === 0) return new Set<string>()

  const { data, error } = await supabase
    .from('family_groups')
    .select('id')
    .in('id', ids)
    .in('status', ['active', 'past_due'])

  if (error) {
    console.warn('[family-abuse] Active family lookup warning:', error)
    return new Set<string>()
  }

  return new Set((data || []).map((group: any) => group.id))
}

/**
 * F7.4-R: Target user cannot already own an active/past_due Family plan.
 * Pro users are allowed; profile.plan='family' alone is not used as proof.
 */
export async function checkTargetNotOwner(
  supabase: any,
  familyGroupId: string,
  targetEmail: string
): Promise<{ valid: boolean; error?: string; targetUserId?: string | null; targetPlan?: string | null }> {
  const targetProfile = await getTargetProfileByEmail(supabase, targetEmail)
  if (!targetProfile?.id) {
    return { valid: true, targetUserId: null, targetPlan: null }
  }

  const { data: ownedGroups, error } = await supabase
    .from('family_groups')
    .select('id')
    .eq('owner_user_id', targetProfile.id)
    .in('status', ['active', 'past_due'])
    .limit(1)

  if (error) {
    console.warn('[family-abuse] Owner conflict lookup warning:', error)
    return { valid: true, targetUserId: targetProfile.id, targetPlan: targetProfile.plan || null }
  }

  if (ownedGroups && ownedGroups.length > 0) {
    return {
      valid: false,
      error:
        ownedGroups[0].id === familyGroupId
          ? 'Cannot invite yourself'
          : 'This user already owns a Renewly Family plan.',
      targetUserId: targetProfile.id,
      targetPlan: targetProfile.plan || null,
    }
  }

  return { valid: true, targetUserId: targetProfile.id, targetPlan: targetProfile.plan || null }
}

/**
 * F7.4-R: Target user cannot already be an active member of any active/past_due
 * Family group. Removed/cancelled memberships do not block reinvitation.
 */
export async function checkTargetNotActiveMember(
  supabase: any,
  familyGroupId: string,
  targetUserId: string
): Promise<{ valid: boolean; error?: string }> {
  const { data: activeMemberships, error } = await supabase
    .from('family_members')
    .select('id, family_group_id')
    .eq('user_id', targetUserId)
    .eq('status', 'active')
    .eq('role', 'member')

  if (error) {
    console.warn('[family-abuse] Active member lookup warning:', error)
    return { valid: true }
  }

  const groupIds = (activeMemberships || []).map((member: any) => member.family_group_id)
  const activeFamilyIds = await getActiveOrPastDueFamilyIds(supabase, groupIds)
  const blockingMembership = (activeMemberships || []).find((member: any) =>
    activeFamilyIds.has(member.family_group_id)
  )

  if (blockingMembership) {
    return {
      valid: false,
      error:
        blockingMembership.family_group_id === familyGroupId
          ? 'This user is already an active member of this family group.'
          : 'This user is already part of another Renewly Family.',
    }
  }

  return { valid: true }
}

/**
 * F7.4-R: Same email cannot hold unresolved pending invites in active/past_due
 * Family groups. Expired/cancelled/accepted invites do not block.
 */
export async function checkNoPendingInvitesAcrossAll(
  supabase: any,
  targetEmail: string,
  currentFamilyGroupId?: string
): Promise<{ valid: boolean; error?: string }> {
  const nowIso = new Date().toISOString()
  const { data: existing, error } = await supabase
    .from('family_invites')
    .select('id, family_group_id, expires_at')
    .ilike('invited_email', targetEmail)
    .eq('status', 'pending')

  if (error) {
    console.warn('[family-abuse] Pending invite lookup warning:', error)
    return { valid: true }
  }

  const notExpired = (existing || []).filter((invite: any) => {
    if (!invite.expires_at) return true
    return new Date(invite.expires_at).getTime() > new Date(nowIso).getTime()
  })

  if (notExpired.length === 0) return { valid: true }

  const activeFamilyIds = await getActiveOrPastDueFamilyIds(
    supabase,
    notExpired.map((invite: any) => invite.family_group_id)
  )
  const blockingInvite = notExpired.find((invite: any) => activeFamilyIds.has(invite.family_group_id))

  if (!blockingInvite) return { valid: true }

  return {
    valid: false,
    error:
      blockingInvite.family_group_id === currentFamilyGroupId
        ? 'Invite already pending.'
        : 'This user already has a pending Family invite.',
  }
}
