import { FAMILY_INCLUDED_MEMBER_COUNT, FAMILY_EXTRA_MEMBER_PRICE_INR } from './family-config'

/**
 * Get the included seat limit for a family group
 * Uses group's included_member_limit if present, otherwise uses config
 */
export function getIncludedSeatLimit(familyGroup: { included_member_limit?: number } | null): number {
  if (familyGroup?.included_member_limit) {
    return familyGroup.included_member_limit
  }
  return FAMILY_INCLUDED_MEMBER_COUNT
}

/**
 * Get the price per extra seat
 */
export function getExtraSeatPriceINR(): number {
  return FAMILY_EXTRA_MEMBER_PRICE_INR
}

interface SeatCalculationInput {
  activeMembers: Array<{ id: string; role: string; seat_type: string }>
  pendingInvites: Array<{ id: string; seat_type: string }>
  familyGroup: { included_member_limit?: number; extra_seat_count?: number } | null
}

export interface SeatUsage {
  includedLimit: number
  activeIncludedMembers: number
  pendingIncludedInvites: number
  includedSeatsUsed: number
  availableIncludedSeats: number
  extraSeatCount: number
  activeExtraMembers: number
  pendingExtraInvites: number
  totalSeatsUsed: number
}

/**
 * Calculate detailed seat usage for a family group
 * 
 * Rules:
 * - Count only non-owner active members
 * - Included seats count active included members + pending included invites
 * - Extra seats count active extra members + pending extra invites
 * - Never count removed members
 * - Never count cancelled/expired invites
 */
export function calculateSeatUsage(input: SeatCalculationInput): SeatUsage {
  const { activeMembers, pendingInvites, familyGroup } = input

  const includedLimit = getIncludedSeatLimit(familyGroup)

  // Count active members (non-owner, not removed)
  const activeIncludedMembers = activeMembers.filter(
    (m) => m.role !== 'owner' && m.seat_type === 'included'
  ).length

  const activeExtraMembers = activeMembers.filter(
    (m) => m.role !== 'owner' && m.seat_type === 'extra'
  ).length

  // Count pending invites (pending status, not cancelled/expired)
  const pendingIncludedInvites = pendingInvites.filter(
    (i) => i.seat_type === 'included'
  ).length

  const pendingExtraInvites = pendingInvites.filter(
    (i) => i.seat_type === 'extra'
  ).length

  const includedSeatsUsed = activeIncludedMembers + pendingIncludedInvites
  const availableIncludedSeats = Math.max(0, includedLimit - includedSeatsUsed)

  const extraSeatCount = familyGroup?.extra_seat_count ?? 0
  const totalSeatsUsed = includedSeatsUsed + activeExtraMembers + pendingExtraInvites

  return {
    includedLimit,
    activeIncludedMembers,
    pendingIncludedInvites,
    includedSeatsUsed,
    availableIncludedSeats,
    extraSeatCount,
    activeExtraMembers,
    pendingExtraInvites,
    totalSeatsUsed,
  }
}

/**
 * Check if included seats are full
 */
export function areIncludedSeatsFull(seatUsage: SeatUsage): boolean {
  return seatUsage.availableIncludedSeats <= 0
}

/**
 * Check if a user can invite another member without extra seat payment
 */
export function canInviteWithIncludedSeat(seatUsage: SeatUsage): boolean {
  return seatUsage.availableIncludedSeats > 0
}
