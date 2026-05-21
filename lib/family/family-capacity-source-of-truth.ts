/**
 * Combo 3B Part A: Unified Family Capacity Source of Truth
 *
 * Single shared source of truth used by:
 * - Family page
 * - Settings Plan & Billing
 * - Dashboard Renewly Family card
 * - Dashboard monthly/annual totals
 * - Calendar Renewly Family renewal
 * - Subscription card display
 * - Invite routes
 *
 * This prevents drift and ensures all pages show consistent numbers.
 */

import { calculateSeatUsage, clampExtraSeatQuantity } from './family-seat-utils'
import { FAMILY_INCLUDED_MEMBER_COUNT, FAMILY_MAX_EXTRA_MEMBER_COUNT } from './family-config'
import type { SeatUsage } from './family-seat-utils'

export interface FamilyCapacityCalculation {
  // Included seat counts
  activeIncludedMembers: number
  pendingIncludedInvites: number
  includedReserved: number
  includedAvailable: number

  // Extra seat counts
  activeExtraMembers: number
  pendingExtraInvites: number
  extraReserved: number
  extraAvailable: number

  // Billing-relevant extra counts
  activePaidExtraSeatQuantity: number
  scheduledCancelExtraSeatQuantity: number
  reusableExtraSeats: number

  // Totals and limits
  totalInvitedMembers: number
  maxIncludedSeats: number
  maxExtraSeats: number
  maxInvitedMembers: number

  // Billing totals
  currentBillableExtraSeats: number
  currentMonthlyTotal: number
  nextCycleMonthlyTotal: number

  // Display flags
  isAtMaxCapacity: boolean
  hasUnpaidReserved: boolean
  hasScheduledCancellation: boolean
  emergencyOverflow: boolean
}

export interface FamilyCapacityInput {
  seatUsage: SeatUsage
  seatAddons?: Array<{
    quantity?: number | null
    status?: string | null
    cancel_at_period_end?: boolean | null
  }>
  baseAmount?: number
  extraUnitAmount?: number
}

const FAMILY_BASE_AMOUNT_INR = 299
const FAMILY_EXTRA_UNIT_AMOUNT_INR = 99

/**
 * Combo 3B Part A: Calculate unified family capacity state from existing utilities
 *
 * Consolidates seat-utils and billing-state into single calculation,
 * ensuring all pages get consistent numbers.
 *
 * Rules:
 * - activeIncludedMembers: Non-owner active members with seat_type='included'
 * - pendingIncludedInvites: Pending invites that fit in included capacity
 * - activeExtraMembers: Non-owner active members with seat_type='extra'
 * - pendingExtraInvites: Pending invites that need extra capacity
 * - Cancelled/removed don't count
 * - Pending extra invites reserve paid capacity
 * - Never return more than 4 extra seats
 * - Never display +5 or ₹794
 */
export function calculateUnifiedFamilyCapacity(
  input: FamilyCapacityInput
): FamilyCapacityCalculation {
  const baseAmount = input.baseAmount ?? FAMILY_BASE_AMOUNT_INR
  const extraUnitAmount = input.extraUnitAmount ?? FAMILY_EXTRA_UNIT_AMOUNT_INR
  const seatUsage = input.seatUsage
  const seatAddons = input.seatAddons || []

  // Extract from seatUsage (already calculated correctly by family-seat-utils)
  const activeIncludedMembers = seatUsage.activeIncludedMembers
  const pendingIncludedInvites = seatUsage.pendingIncludedInvites
  const includedReserved = activeIncludedMembers + pendingIncludedInvites
  const includedAvailable = Math.max(0, FAMILY_INCLUDED_MEMBER_COUNT - includedReserved)

  const activeExtraMembers = seatUsage.activeExtraMembers
  const pendingExtraInvites = seatUsage.pendingExtraInvites
  const extraReserved = clampExtraSeatQuantity(activeExtraMembers + pendingExtraInvites)
  const extraAvailable = Math.max(0, FAMILY_MAX_EXTRA_MEMBER_COUNT - extraReserved)

  // Total invited members (owner not counted)
  const totalInvitedMembers = seatUsage.totalSeatsUsed - 1 // Subtract owner

  // Max values
  const maxIncludedSeats = FAMILY_INCLUDED_MEMBER_COUNT
  const maxExtraSeats = FAMILY_MAX_EXTRA_MEMBER_COUNT
  const maxInvitedMembers = maxIncludedSeats + maxExtraSeats

  // Billing - use reconciled count (active OR reserved, whichever is higher)
  const activePaidExtraSeatQuantity = seatUsage.paidActiveExtraSeats
  const currentBillableExtraSeats = seatUsage.reconciledExtraSeatCount

  // Scheduled cancellations
  const scheduledAddons = seatAddons.filter((a) => a.cancel_at_period_end === true && (a.status ?? 'active') === 'active')
  const rawScheduledCancelCount = scheduledAddons.reduce((sum, a) => sum + Math.max(0, a.quantity ?? 0), 0)
  const scheduledCancelExtraSeatQuantity = Math.min(rawScheduledCancelCount, currentBillableExtraSeats)
  const continuingExtraSeats = Math.max(0, currentBillableExtraSeats - scheduledCancelExtraSeatQuantity)

  // Reusable calculation (can use for next invite without payment)
  const reusableExtraSeats = Math.max(0, currentBillableExtraSeats - extraReserved)

  // Billing totals
  const currentMonthlyTotal = baseAmount + currentBillableExtraSeats * extraUnitAmount
  const nextCycleMonthlyTotal = baseAmount + continuingExtraSeats * extraUnitAmount

  // Safety checks/flags
  const isAtMaxCapacity = totalInvitedMembers >= maxInvitedMembers
  const hasUnpaidReserved = seatUsage.unpaidReservedExtraSeats > 0
  const hasScheduledCancellation = scheduledCancelExtraSeatQuantity > 0

  // Emergency overflow flag (stale DB > 4)
  const emergencyOverflow = seatUsage.reconciledExtraSeatCount > FAMILY_MAX_EXTRA_MEMBER_COUNT

  return {
    activeIncludedMembers,
    pendingIncludedInvites,
    includedReserved,
    includedAvailable,

    activeExtraMembers,
    pendingExtraInvites,
    extraReserved,
    extraAvailable,

    activePaidExtraSeatQuantity,
    scheduledCancelExtraSeatQuantity,
    reusableExtraSeats,

    totalInvitedMembers,
    maxIncludedSeats,
    maxExtraSeats,
    maxInvitedMembers,

    currentBillableExtraSeats,
    currentMonthlyTotal,
    nextCycleMonthlyTotal,

    isAtMaxCapacity,
    hasUnpaidReserved,
    hasScheduledCancellation,
    emergencyOverflow,
  }
}

/**
 * Format monthly total for display (e.g., "₹695/month")
 */
export function formatMonthlyAmount(amount: number, currency: 'INR' | 'USD' = 'INR'): string {
  if (currency === 'USD') {
    return `$${(amount / 100).toFixed(2)}/month`
  }
  return `₹${amount}/month`
}

/**
 * Safety clamp for display - never show more than 4 or billing of ₹794
 */
export function clampDisplayBilling(
  capacity: FamilyCapacityCalculation
): FamilyCapacityCalculation {
  if (capacity.emergencyOverflow) {
    // Stale DB had >4, clamp to 4 for display
    const clamped = {
      ...capacity,
      currentBillableExtraSeats: FAMILY_MAX_EXTRA_MEMBER_COUNT,
      currentMonthlyTotal:
        FAMILY_BASE_AMOUNT_INR + FAMILY_MAX_EXTRA_MEMBER_COUNT * FAMILY_EXTRA_UNIT_AMOUNT_INR,
      emergencyOverflow: false,
    }
    console.warn(
      '[v0] Family capacity overflow detected and clamped to 4 extra seats',
      capacity
    )
    return clamped
  }

  // Verify monthly total never exceeds ₹695
  const maxMonthlyINR = FAMILY_BASE_AMOUNT_INR + FAMILY_MAX_EXTRA_MEMBER_COUNT * FAMILY_EXTRA_UNIT_AMOUNT_INR
  if (capacity.currentMonthlyTotal > maxMonthlyINR) {
    console.warn(
      '[v0] Current monthly total exceeds max (₹695), clamping: ',
      capacity.currentMonthlyTotal
    )
    return {
      ...capacity,
      currentMonthlyTotal: maxMonthlyINR,
    }
  }

  return capacity
}
