import { FAMILY_MAX_EXTRA_MEMBER_COUNT } from '@/lib/family/family-config'

/**
 * Billing display utilities for Renewly Family plan
 * Supports base family + extra-seat pricing display
 */

export const FAMILY_BASE_PRICE_INR = 299
export const FAMILY_BASE_PRICE_USD = 8.99
export const FAMILY_EXTRA_SEAT_PRICE_INR = 99
export const FAMILY_EXTRA_SEAT_PRICE_USD = 1.49

export interface FamilyBillingInfo {
  activeMemberCount: number
  activeExtraMembers: number
  pendingIncludedInvites: number
  pendingExtraInvites: number
  currency: 'INR' | 'USD'
}

export interface FamilyBillingDisplay {
  planName: string
  memberSummary: string
  seatsSummary: string
  extraMembersLabel?: string
  extraMembersPrice?: string
  billingItems: Array<{
    label: string
    amount: string
    type: 'base' | 'extra'
  }>
  totalMonthlyRenewal: string
}

/**
 * Calculate Family plan billing display info
 * Returns formatted strings for UI display
 */
export function calculateFamilyBillingDisplay(info: FamilyBillingInfo): FamilyBillingDisplay {
  const { activeMemberCount, activeExtraMembers, pendingIncludedInvites, pendingExtraInvites, currency } = info

  const isINR = currency === 'INR'
  const basePrice = isINR ? FAMILY_BASE_PRICE_INR : FAMILY_BASE_PRICE_USD
  const extraSeatPrice = isINR ? FAMILY_EXTRA_SEAT_PRICE_INR : FAMILY_EXTRA_SEAT_PRICE_USD
  const currencySymbol = isINR ? '₹' : '$'

  // Calculate totals (1 owner + members + extra members).
  // Guardrail: historical bugs may leave more than four active add-on units in DB.
  // Never display or bill more than the supported max of four extra invited members.
  const totalMembers = 1 + activeMemberCount // owner + active invited members
  const totalExtraMembers = Math.min(
    Math.max(0, Number(activeExtraMembers || 0)),
    FAMILY_MAX_EXTRA_MEMBER_COUNT
  )

  // Calculate pricing
  const basePriceTotal = basePrice
  const extraPriceTotal = totalExtraMembers * extraSeatPrice
  const totalMonthly = basePriceTotal + extraPriceTotal

  // Member summary: "Owner + X invited members"
  let memberSummary = 'Owner'
  if (totalMembers > 1) {
    const invitedCount = totalMembers - 1
    memberSummary = `Owner + ${invitedCount} invited member${invitedCount !== 1 ? 's' : ''}`
  }

  // Seats summary: "Included seats: Y of 4 used"
  const includedSeatsUsed = activeMemberCount + pendingIncludedInvites
  const seatsSummary = `Included seats: ${includedSeatsUsed} of 4 used`

  // Build billing items array
  const billingItems: FamilyBillingDisplay['billingItems'] = [
    {
      label: 'Base Family plan',
      amount: `${currencySymbol}${basePriceTotal}${isINR ? '' : '.00'}/month`,
      type: 'base',
    },
  ]

  // Add extra members line if exists
  let extraMembersLabel: string | undefined
  let extraMembersPrice: string | undefined

  if (totalExtraMembers > 0) {
    extraMembersLabel = `Extra members: +${totalExtraMembers}`
    if (isINR) {
      extraMembersPrice = `${totalExtraMembers} × ₹${extraSeatPrice}/month`
    } else {
      extraMembersPrice = `${totalExtraMembers} × $${extraSeatPrice}/month`
    }

    billingItems.push({
      label: `Extra members: +${totalExtraMembers}`,
      amount: `${currencySymbol}${extraPriceTotal}${isINR ? '' : '.00'}/month`,
      type: 'extra',
    })
  }

  return {
    planName: 'Renewly Family',
    memberSummary,
    seatsSummary,
    extraMembersLabel,
    extraMembersPrice,
    billingItems,
    totalMonthlyRenewal: `${currencySymbol}${totalMonthly}${isINR ? '' : '.00'}/month`,
  }
}

/**
 * Get Renewly Family billing currency based on user location or profile
 * Defaults to INR for India, USD for international
 */
export function getFamilyBillingCurrency(userCurrency?: string): 'INR' | 'USD' {
  if (userCurrency === 'USD' || userCurrency === 'usd') {
    return 'USD'
  }
  // Default to INR
  return 'INR'
}
