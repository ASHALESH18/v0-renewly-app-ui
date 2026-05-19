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
  const hasPaidCapacity = seatUsage.paidActiveExtraSeats >= requiredAfterInvite

  // Need payment if no paid capacity available
  return !hasPaidCapacity
}

/**
 * F7.4: Validate invite eligibility with full context
 * 
 * Performs all eligibility checks:
 * - Determines seat type (included vs extra)
 * - Checks if extra seat requires payment
 * - Returns detailed capacity state
 */
export async function validateInviteEligibility(
  supabase: any,
  familyGroupId: string
): Promise<InviteEligibilityResult> {
  try {
    // Fetch family group
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('id, included_member_limit, extra_seat_count, current_period_end')
      .eq('id', familyGroupId)
      .single()

    if (groupError || !familyGroup) {
      return {
        eligible: false,
        seatType: 'included',
        requiresExtraSeats: false,
        requiresPayment: false,
        currentCapacity: {
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
          extraSeatsEndingAtPeriodEnd: 0,
          currentPeriodEnd: null,
        },
        error: 'Family group not found',
      }
    }

    // Fetch active members (excludes owner)
    const { data: activeMembers } = await supabase
      .from('family_members')
      .select('id, role, seat_type')
      .eq('family_group_id', familyGroupId)
      .eq('status', 'active')

    // Fetch pending invites (non-expired)
    const { data: allInvites } = await supabase
      .from('family_invites')
      .select('id, seat_type, expires_at, status')
      .eq('family_group_id', familyGroupId)

    // Filter pending non-expired invites
    const now = new Date()
    const pendingInvites = (allInvites || []).filter(inv => {
      if (inv.status !== 'pending') return false
      const expiresAt = new Date(inv.expires_at)
      return expiresAt > now
    })

    // Fetch seat addons for extra seat capacity
    const { data: seatAddons } = await supabase
      .from('family_seat_addons')
      .select('id, quantity, status, cancel_at_period_end, current_period_end')
      .eq('family_group_id', familyGroupId)

    // Calculate current usage
    const currentCapacity = calculateSeatUsage({
      activeMembers: activeMembers || [],
      pendingInvites: pendingInvites || [],
      familyGroup,
      seatAddons: seatAddons || [],
    })

    // Determine seat type for next invite
    const seatType = determineInviteSeatType(currentCapacity)
    const requiresExtraSeats = seatType === 'extra'
    const requiresPayment = requiresExtraSeatPayment(currentCapacity)

    return {
      eligible: true,
      seatType,
      requiresExtraSeats,
      requiresPayment,
      currentCapacity,
    }
  } catch (error) {
    return {
      eligible: false,
      seatType: 'included',
      requiresExtraSeats: false,
      requiresPayment: false,
      currentCapacity: {
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
        extraSeatsEndingAtPeriodEnd: 0,
        currentPeriodEnd: null,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
