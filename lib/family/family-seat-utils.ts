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

export interface ExtraSeatReuseState {
  requiredExtraSeats: number
  paidActiveExtraSeats: number
  reusableExtraSeats: number
  surplusExtraSeats: number
}

interface SeatCalculationInput {
  activeMembers: Array<{ id: string; role: string; seat_type: string }>
  pendingInvites: Array<{ id: string; seat_type: string }>
  familyGroup: { included_member_limit?: number; extra_seat_count?: number } | null
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

/**
 * Calculate extra-seat reuse and surplus state (F7)
 * 
 * Rules:
 * - requiredExtraSeats = max(0, activeExtraMembers + pendingExtraInvites - includedLimit)
 *   but must satisfy: activeIncludedMembers + activeExtraMembers <= paidExtraSeats
 * - reusableExtraSeats = paid seats currently unused (has capacity)
 * - surplusExtraSeats = paid seats not needed and should schedule cancellation
 * 
 * Examples:
 * - 4 included + 1 active extra + 1 pending extra: requires 2 extra seats
 * - 4 included + 2 paid extra + 0 active/pending: 2 surplus extra seats
 * - 3 included + 1 removed + 2 paid extra: 1 surplus extra seat after recalc
 */
export function calculateExtraSeatReuseState(
  seatUsage: SeatUsage
): ExtraSeatReuseState {
  // Required extra seats = total active + pending extra members beyond included limit
  const activeAndPendingExtra = seatUsage.activeExtraMembers + seatUsage.pendingExtraInvites
  const extraMembersOverIncluded = Math.max(
    0,
    activeAndPendingExtra - (seatUsage.includedLimit - seatUsage.activeIncludedMembers)
  )
  const requiredExtraSeats = Math.max(0, extraMembersOverIncluded)

  const paidActiveExtraSeats = seatUsage.extraSeatCount
  const reusableExtraSeats = Math.max(0, paidActiveExtraSeats - requiredExtraSeats)
  const surplusExtraSeats = reusableExtraSeats

  return {
    requiredExtraSeats,
    paidActiveExtraSeats,
    reusableExtraSeats,
    surplusExtraSeats,
  }
}
