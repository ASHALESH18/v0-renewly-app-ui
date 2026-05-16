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
