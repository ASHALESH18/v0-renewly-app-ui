// COMBO-1/F7.3: Family Seat Guardrails
// Validation rules for seat capacity, invites, cancellations

import { calculateSeatUsage, calculateExtraSeatReuseState, type SeatUsage, type ExtraSeatReuseState } from './family-seat-utils'
import { FAMILY_INCLUDED_MEMBER_COUNT, FAMILY_MAX_EXTRA_MEMBER_COUNT } from './family-config'
import type { SeatMember, SeatInvite, SeatAddon, SeatFamilyGroup } from './family-seat-utils'

export interface SeatCapacityError {
  code: 'included_full' | 'max_extra_seats' | 'insufficient_reusable'
  message: string
  data?: {
    includedLimit?: number
    includedUsed?: number
    extraLimit?: number
    extraUsed?: number
    reusableSeats?: number
  }
}

export interface CancelGuardrailResult {
  canCancel: boolean
  error?: SeatCapacityError
  reusableSeats: number
  membersToRemove: SeatMember[]
  reason?: string
}

/**
 * COMBO-1/F7.3: Validate that an invite can be added to the family.
 * Checks both included and extra seat capacity.
 */
export function validateInviteCapacity(
  activeMembers: SeatMember[],
  pendingInvites: SeatInvite[],
  familyGroup: SeatFamilyGroup | null,
  seatAddons: SeatAddon[] = [],
  seatType: 'included' | 'extra' = 'included'
): { valid: boolean; error?: SeatCapacityError } {
  const seatUsage = calculateSeatUsage({
    activeMembers,
    pendingInvites,
    familyGroup,
    seatAddons,
  })

  if (seatType === 'included') {
    if (seatUsage.availableIncludedSeats <= 0) {
      return {
        valid: false,
        error: {
          code: 'included_full',
          message: `Included seats are full (${seatUsage.includedSeatsUsed}/${seatUsage.includedLimit} used)`,
          data: {
            includedLimit: seatUsage.includedLimit,
            includedUsed: seatUsage.includedSeatsUsed,
          },
        },
      }
    }
  } else if (seatType === 'extra') {
    // Check if we have paid extra seats available for this invite
    const reuseState = calculateExtraSeatReuseState(seatUsage)
    const nextRequiredSeats = Math.max(0, seatUsage.totalSeatsUsed + 1 - seatUsage.includedLimit)
    
    if (nextRequiredSeats > seatUsage.paidReusableExtraSeats) {
      return {
        valid: false,
        error: {
          code: 'insufficient_reusable',
          message: `Not enough extra seats for this invite (${reuseState.reusableExtraSeats} reusable available)`,
          data: {
            extraLimit: seatUsage.paidReusableExtraSeats,
            extraUsed: reuseState.requiredExtraSeats,
            reusableSeats: reuseState.reusableExtraSeats,
          },
        },
      }
    }
  }

  return { valid: true }
}

/**
 * COMBO-1/F7.3: Validate that an extra seat addon can be purchased.
 * Checks that family won't exceed max extra seat limit (4+4=8).
 */
export function validateExtraSeatPurchase(
  currentExtraSeats: number,
  quantityToPurchase: number
): { valid: boolean; error?: SeatCapacityError } {
  const maxAllowedExtraSeats = FAMILY_MAX_EXTRA_MEMBER_COUNT || 4
  const totalAfterPurchase = currentExtraSeats + quantityToPurchase

  if (totalAfterPurchase > maxAllowedExtraSeats) {
    return {
      valid: false,
      error: {
        code: 'max_extra_seats',
        message: `Purchasing ${quantityToPurchase} extra seats would exceed maximum of ${maxAllowedExtraSeats} (currently ${currentExtraSeats})`,
        data: {
          extraLimit: maxAllowedExtraSeats,
          extraUsed: totalAfterPurchase,
        },
      },
    }
  }

  return { valid: true }
}

/**
 * COMBO-1/F7.3: Validate that an extra seat addon can be cancelled.
 * Ensures that members on extra seats can be removed or reassigned to included seats.
 */
export function validateExtraSeatCancellation(
  activeMembers: SeatMember[],
  pendingInvites: SeatInvite[],
  familyGroup: SeatFamilyGroup | null,
  seatAddons: SeatAddon[] = [],
  addonQuantityToCancelList: number[] = []
): CancelGuardrailResult {
  const seatUsage = calculateSeatUsage({
    activeMembers,
    pendingInvites,
    familyGroup,
    seatAddons,
  })

  const totalCancelling = addonQuantityToCancelList.reduce((sum, qty) => sum + qty, 0)
  const reuseState = calculateExtraSeatReuseState(seatUsage)

  // After cancellation, extra seats remaining
  const extraSeatsAfterCancel = seatUsage.paidActiveExtraSeats - totalCancelling

  // Members that must be removed or reassigned
  const extraMembersToRemove = activeMembers.filter(
    (member) => member.seat_type === 'extra'
  )

  // If we're cancelling more seats than we have removable members, we have a problem
  const totalMembersToRemoveIfNeeded = Math.max(0, seatUsage.totalSeatsUsed - seatUsage.includedLimit)
  const canRemoveEnough = extraSeatsAfterCancel >= totalMembersToRemoveIfNeeded

  if (!canRemoveEnough) {
    return {
      canCancel: false,
      reusableSeats: reuseState.reusableExtraSeats,
      membersToRemove: extraMembersToRemove,
      error: {
        code: 'insufficient_reusable',
        message: `Cannot cancel ${totalCancelling} seats. After cancellation, only ${extraSeatsAfterCancel} extra seats remain, but ${totalMembersToRemoveIfNeeded} members are on extra seats.`,
        data: {
          extraLimit: extraSeatsAfterCancel,
          extraUsed: totalMembersToRemoveIfNeeded,
        },
      },
    }
  }

  return {
    canCancel: true,
    reusableSeats: reuseState.reusableExtraSeats - totalCancelling,
    membersToRemove: extraMembersToRemove,
  }
}

/**
 * COMBO-1/F7.3: Check if a member can be invited (not duplicate, not self).
 */
export function validateMembershipRules(options: {
  invitingUserId: string
  inviteeEmail: string
  existingMembers: Array<{ email?: string }>
  pendingInvites: Array<{ recipient_email?: string }>
}): { valid: boolean; error?: string } {
  const { invitingUserId, inviteeEmail, existingMembers, pendingInvites } = options

  // Rule 1: Can't invite self (simple email check)
  if (inviteeEmail.toLowerCase() === invitingUserId.toLowerCase()) {
    return { valid: false, error: 'Cannot invite yourself to the family' }
  }

  // Rule 2: Can't invite someone already a member
  if (existingMembers.some((m) => m.email?.toLowerCase() === inviteeEmail.toLowerCase())) {
    return { valid: false, error: 'This person is already a member of the family' }
  }

  // Rule 3: Can't send duplicate invite
  if (pendingInvites.some((i) => i.recipient_email?.toLowerCase() === inviteeEmail.toLowerCase())) {
    return { valid: false, error: 'An invite has already been sent to this email' }
  }

  return { valid: true }
}
