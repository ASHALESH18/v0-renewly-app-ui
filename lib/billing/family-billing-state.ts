import { FAMILY_MAX_EXTRA_MEMBER_COUNT } from '@/lib/family/family-config'

/**
 * F7.2D-R: Shared Family billing state helper
 *
 * Single source of truth for computing current-cycle vs next-cycle billing
 * when extra-seat add-ons may be scheduled for cancellation.
 *
 * Rules:
 *  - currentExtraSeatCount counts ACTIVE add-ons (status='active') including those
 *    with cancel_at_period_end=true (they remain active until current_period_end).
 *  - scheduledCancelExtraSeatCount counts active add-ons where cancel_at_period_end=true.
 *  - continuingExtraSeatCount = currentExtraSeatCount - scheduledCancelExtraSeatCount.
 *  - currentMonthlyTotal = baseAmount + currentExtraSeatCount * extraSeatUnitAmount.
 *  - nextCycleMonthlyTotal = baseAmount + continuingExtraSeatCount * extraSeatUnitAmount.
 */

export const FAMILY_BASE_AMOUNT_INR = 299
export const FAMILY_EXTRA_SEAT_UNIT_INR = 99

export type FamilySeatAddonRow = {
  id?: string
  quantity?: number | null
  status?: string | null
  cancel_at_period_end?: boolean | null
  current_period_end?: string | null
}

export type FamilyBillingState = {
  baseAmount: number
  extraSeatUnitAmount: number
  currentExtraSeatCount: number
  rawCurrentExtraSeatCount: number
  hasExtraSeatOverflow: boolean
  reservedExtraSeatCount: number
  hasUnpaidReservedExtraSeats: boolean
  unpaidReservedExtraSeatCount: number
  scheduledCancelExtraSeatCount: number
  continuingExtraSeatCount: number
  currentMonthlyTotal: number
  nextCycleMonthlyTotal: number
  /** ISO date string of the soonest scheduled add-on cancellation, if any */
  scheduledCancelDate: string | null
  hasScheduledExtraSeatCancellation: boolean
  currentCycleLabel: string
  nextCycleLabel: string
  cancellationSummaryText: string | null
  currency: 'INR'
}

export type ComputeFamilyBillingStateInput = {
  /** Family group's current period end (fallback if addon doesn't have one) */
  currentPeriodEnd?: string | null
  /** Active family_seat_addons rows for the family group */
  seatAddons?: FamilySeatAddonRow[] | null
  /** Optional override for base plan amount (defaults to ₹299) */
  baseAmount?: number
  /** Optional override for per-seat amount (defaults to ₹99) */
  extraSeatUnitAmount?: number
  /** Active extra members + pending extra-seat invites that already reserve capacity */
  reservedExtraSeatCount?: number
}

function formatINR(amount: number): string {
  return `₹${amount}/month`
}

/**
 * Compute the family billing state from add-ons.
 * Pure function — no I/O.
 */
export function computeFamilyBillingState(
  input: ComputeFamilyBillingStateInput
): FamilyBillingState {
  const baseAmount = input.baseAmount ?? FAMILY_BASE_AMOUNT_INR
  const extraSeatUnitAmount = input.extraSeatUnitAmount ?? FAMILY_EXTRA_SEAT_UNIT_INR

  // Only consider active add-ons.
  const activeAddons = (input.seatAddons || []).filter(
    (a) => (a?.status ?? 'active') === 'active'
  )

  const rawCurrentExtraSeatCount = activeAddons.reduce(
    (sum, a) => sum + Math.max(0, a.quantity ?? 0),
    0
  )

  const reservedExtraSeatCount = Math.min(
    Math.max(0, Number(input.reservedExtraSeatCount || 0)),
    FAMILY_MAX_EXTRA_MEMBER_COUNT
  )

  // If pending extra invites already exist, they reserve capacity even if an older
  // build failed to persist the matching add-on quantity. This keeps Dashboard,
  // Calendar, Settings, and Family page consistent during reconciliation.
  const currentExtraSeatCount = Math.min(
    Math.max(rawCurrentExtraSeatCount, reservedExtraSeatCount),
    FAMILY_MAX_EXTRA_MEMBER_COUNT
  )
  const hasExtraSeatOverflow = rawCurrentExtraSeatCount > FAMILY_MAX_EXTRA_MEMBER_COUNT
  const unpaidReservedExtraSeatCount = Math.max(0, reservedExtraSeatCount - rawCurrentExtraSeatCount)
  const hasUnpaidReservedExtraSeats = unpaidReservedExtraSeatCount > 0

  const scheduledAddons = activeAddons.filter((a) => a.cancel_at_period_end === true)
  const rawScheduledCancelExtraSeatCount = scheduledAddons.reduce(
    (sum, a) => sum + Math.max(0, a.quantity ?? 0),
    0
  )
  const scheduledCancelExtraSeatCount = Math.min(
    rawScheduledCancelExtraSeatCount,
    currentExtraSeatCount
  )

  const continuingExtraSeatCount = Math.min(
    FAMILY_MAX_EXTRA_MEMBER_COUNT,
    Math.max(0, currentExtraSeatCount - scheduledCancelExtraSeatCount)
  )

  const currentMonthlyTotal = baseAmount + currentExtraSeatCount * extraSeatUnitAmount
  const nextCycleMonthlyTotal = baseAmount + continuingExtraSeatCount * extraSeatUnitAmount

  // Earliest scheduled period_end is when cancellations take effect.
  const scheduledCancelDate =
    scheduledAddons
      .map((a) => a.current_period_end)
      .filter((d): d is string => !!d)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ||
    (scheduledAddons.length > 0 ? input.currentPeriodEnd ?? null : null)

  const hasScheduledExtraSeatCancellation = scheduledCancelExtraSeatCount > 0

  let cancellationSummaryText: string | null = null
  if (hasScheduledExtraSeatCancellation && scheduledCancelDate) {
    const formatted = new Date(scheduledCancelDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    if (scheduledCancelExtraSeatCount === 1) {
      cancellationSummaryText = `Extra seat cancels on ${formatted}`
    } else {
      cancellationSummaryText = `${scheduledCancelExtraSeatCount} extra seats cancel on ${formatted}`
    }
  }

  return {
    baseAmount,
    extraSeatUnitAmount,
    currentExtraSeatCount,
    rawCurrentExtraSeatCount,
    hasExtraSeatOverflow,
    reservedExtraSeatCount,
    hasUnpaidReservedExtraSeats,
    unpaidReservedExtraSeatCount,
    scheduledCancelExtraSeatCount,
    continuingExtraSeatCount,
    currentMonthlyTotal,
    nextCycleMonthlyTotal,
    scheduledCancelDate,
    hasScheduledExtraSeatCancellation,
    currentCycleLabel: formatINR(currentMonthlyTotal),
    nextCycleLabel: formatINR(nextCycleMonthlyTotal),
    cancellationSummaryText,
    currency: 'INR',
  }
}
