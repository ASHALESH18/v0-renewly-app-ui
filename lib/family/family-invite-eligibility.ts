/**
 * F7.4: Family Invite Eligibility Validation
 * 
 * Determines seat type (included vs extra) and validates capacity constraints
 * for family invitations before creation and acceptance.
 */

import { createClient } from '@supabase/supabase-js'
import {
  calculateSeatUsage,
  canInviteWithIncludedSeat,
  calculateRequiredExtraSeatsAfterNextInvite,
  SeatUsage,
} from './family-seat-utils'

export type InviteSeatType = 'included' | 'extra'

export interface InviteEligibilityResult {
  eligible: boolean
  seatType: InviteSeatType
  requiresExtraSeats: boolean
  requiresPayment: boolean
  currentCapacity: SeatUsage
  error?: string
}

/**
 * F7.4: Determine if invitation would require included or extra seat
 * 
 * Returns 'included' if space available in included seats, otherwise 'extra'
 */
export function determineInviteSeatType(
  seatUsage: SeatUsage
): InviteSeatType {
  return canInviteWithIncludedSeat(seatUsage) ? 'included' : 'extra'
}

/**
 * F7.4: Check if extra seat invitation requires payment
 * 
 * Returns true if:
 * - Would need extra seat (not fitting in included)
 * - AND no paid extra seats available to reuse
 */
export function requiresExtraSeatPayment(
  seatUsage: SeatUsage
): boolean {
  // If fits in included seats, no payment needed
  if (canInviteWithIncludedSeat(seatUsage)) {
    return false
  }

  // Would need extra seat - check if we have paid capacity
  const requiredAfterInvite = calculateRequiredExtraSeatsAfterNextInvite(seatUsage)
  const hasPaidCapacity = seatUsage.paidReusableExtraSeats >= requiredAfterInvite

  // Need payment if no paid capacity available
  return !hasPaidCapacity
}

/**
 * Combo 3: Unified invite eligibility result with all checks
 */
export interface UnifiedEligibilityResult {
  eligible: boolean
  seatType: InviteSeatType
  requiresExtraSeats: boolean
  requiresPayment: boolean
  currentCapacity: SeatUsage
  targetUserInfo?: {
    isProUser?: boolean
    isOwner?: boolean
    isActiveMember?: boolean
    hasOtherFamilyOwnership?: boolean
    isRemoved?: boolean
  }
  error?: string
  code?: string // error code for specific handling
}

/**
 * Combo 3: Unified invite eligibility check with all constraints
 * 
 * Performs 8 eligibility checks:
 * 1. Not self-invite
 * 2. Target is not family owner
 * 3. Target is not active member of this family
 * 4. Pro users allowed (will be converted on accept)
 * 5. Removed/cancelled members allowed (can be re-invited)
 * 6. No duplicate pending invites
 * 7. No pending invites in other families
 * 8. Seat capacity allows invitation
 */
export async function validateUnifiedInviteEligibility(
  supabase: any,
  familyGroupId: string,
  inviterUserId: string,
  invitedEmail: string
): Promise<UnifiedEligibilityResult> {
  try {
    // Normalize email
    const normalizedEmail = invitedEmail.toLowerCase().trim()

    // Fetch family group
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, owner_user_id, included_member_limit, extra_seat_count, current_period_end')
      .eq('id', familyGroupId)
      .single()

    if (groupError || !familyGroup) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: getDefaultSeatUsage(),
        error: 'Family group not found',
        code: 'family_not_found',
      }
    }

    // Check 1: Inviter is family owner
    if (familyGroup.owner_user_id !== inviterUserId) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: getDefaultSeatUsage(),
        error: 'Only the family owner can invite members',
        code: 'not_owner',
      }
    }

    // Get target user by email
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, email')
      .ilike('email', normalizedEmail)
      .single()

    // Check 1: Not self-invite
    if (targetUser && targetUser.id === inviterUserId) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: getDefaultSeatUsage(),
        error: 'Cannot invite yourself to a family',
        code: 'self_invite',
      }
    }

    const targetUserInfo: UnifiedEligibilityResult['targetUserInfo'] = {
      isProUser: false,
      isOwner: false,
      isActiveMember: false,
      hasOtherFamilyOwnership: false,
      isRemoved: false,
    }

    if (targetUser) {
      // Check 2: Target is not this family's owner
      if (targetUser.id === familyGroup.owner_user_id) {
        return {
          eligible: false,
          seatType: 'included',
          requiresExtraSeats: false,
          requiresPayment: false,
          currentCapacity: getDefaultSeatUsage(),
          error: 'Cannot invite the family owner',
          code: 'target_is_owner',
          targetUserInfo,
        }
      }

      // Check if target owns another family (active or past_due)
      const { data: otherFamilies } = await supabase
        .from('family_groups')
        .select('id')
        .eq('owner_user_id', targetUser.id)
        .in('status', ['active', 'past_due'])

      if (otherFamilies && otherFamilies.length > 0) {
        targetUserInfo.hasOtherFamilyOwnership = true
        return {
          eligible: false,
          seatType: 'included',
          requiresExtraSeats: false,
          requiresPayment: false,
          currentCapacity: getDefaultSeatUsage(),
          error: 'This user already owns another active Family plan',
          code: 'already_owns_family',
          targetUserInfo,
        }
      }

      // Check 3: Target not already active member of this family
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id, status')
        .eq('family_group_id', familyGroupId)
        .eq('user_id', targetUser.id)
        .eq('status', 'active')
        .single()

      if (existingMember) {
        targetUserInfo.isActiveMember = true
        return {
          eligible: false,
          seatType: 'included',
          requiresExtraSeats: false,
          requiresPayment: false,
          currentCapacity: getDefaultSeatUsage(),
          error: 'This user is already an active member of this family',
          code: 'already_member',
          targetUserInfo,
        }
      }

      // Check if they're removed/cancelled (allowed to re-invite)
      const { data: removedMember } = await supabase
        .from('family_members')
        .select('id, status')
        .eq('family_group_id', familyGroupId)
        .eq('user_id', targetUser.id)
        .in('status', ['removed', 'cancelled'])
        .single()

      if (removedMember) {
        targetUserInfo.isRemoved = true
      }

      // Check if target is Pro user
      const { data: proSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', targetUser.id)
        .eq('plan', 'pro')
        .eq('status', 'active')
        .single()

      if (proSub) {
        targetUserInfo.isProUser = true
        // Pro users are allowed, will be converted on accept
      }
    }

    // Check 6: No duplicate pending invites in this family
    const { data: duplicatePending } = await supabase
      .from('family_invites')
      .select('id')
      .eq('family_group_id', familyGroupId)
      .ilike('invited_email', normalizedEmail)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .single()

    if (duplicatePending) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: getDefaultSeatUsage(),
        error: 'An invitation to this email already exists in this family',
        code: 'duplicate_pending',
        targetUserInfo,
      }
    }

    // Check 7: No pending invites in other families
    const { data: otherPendingInvites } = await supabase
      .from('family_invites')
      .select('id, family_group_id')
      .ilike('invited_email', normalizedEmail)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .neq('family_group_id', familyGroupId)

    if (otherPendingInvites && otherPendingInvites.length > 0) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: getDefaultSeatUsage(),
        error: 'This email already has a pending invite to another family',
        code: 'pending_in_other_family',
        targetUserInfo,
      }
    }

    // Check 8: Seat capacity allows invitation
    const { data: activeMembers } = await supabase
      .from('family_members')
      .select('id, role, seat_type')
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')

    const { data: allInvites } = await supabase
      .from('family_invites')
      .select('id, seat_type, expires_at, status')
      .eq('family_group_id', familyGroupId)

    const now = new Date()
    const pendingInvites = (allInvites || []).filter(inv => {
      if (inv.status !== 'pending') return false
      const expiresAt = new Date(inv.expires_at)
      return expiresAt > now
    })

    const { data: seatAddons } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroupId)

    const currentCapacity = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup,
      seatAddons: seatAddons || [],
    })

    // Check if at max capacity
    if (currentCapacity.totalSeatsUsed >= currentCapacity.includedLimit + (currentCapacity.paidReusableExtraSeats || 0)) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity,
        error: 'Family has reached maximum capacity',
        code: 'max_capacity',
        targetUserInfo,
      }
    }

    // All checks passed - determine seat type and payment
    const seatType = determineInviteSeatType(currentCapacity)
    const requiresExtraSeats = seatType === 'extra'
    const requiresPayment = requiresExtraSeatPayment(currentCapacity)

    return {
      eligible: true,
      seatType,
      requiresExtraSeats,
      requiresPayment,
      currentCapacity,
      targetUserInfo,
    }
  } catch (error) {
    console.error('[v0] Error validating unified invite eligibility:', error)
    return {
      eligible: false,
      seatType: 'included',
      requiresExtraSeats: false,
      requiresPayment: false,
      currentCapacity: getDefaultSeatUsage(),
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'error',
    }
  }
}

/**
 * Helper to get default seat usage for error cases
 */
function getDefaultSeatUsage(): SeatUsage {
  return {
    includedLimit: 4,
    activeIncludedMembers: 0,
    pendingIncludedInvites: 0,
    includedSeatsUsed: 0,
    availableIncludedSeats: 0,
    extraSeatCount: 0,
    activeExtraMembers: 0,
    pendingExtraInvites: 0,
    totalSeatsUsed: 0,
    paidActiveExtraSeats: 0,
    paidReusableExtraSeats: 0,
    extraSeatsEndingAtPeriodEnd: 0,
    currentPeriodEnd: null,
  }
}
