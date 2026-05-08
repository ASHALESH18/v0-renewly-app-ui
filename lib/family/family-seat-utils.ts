import {
  FAMILY_INCLUDED_MEMBER_COUNT,
  FAMILY_EXTRA_MEMBER_PRICE_INR,
} from './family-config'

export type SeatType = 'owner' | 'included' | 'extra'

export interface SeatMember {
  id: string
  role?: string | null
  seat_type?: SeatType | string | null
}

export interface SeatInvite {
  id: string
  seat_type?: 'included' | 'extra' | string | null
}

export interface SeatAddon {
  id?: string
  quantity?: number | null
  status?: string | null
  cancel_at_period_end?: boolean | null
  current_period_end?: string | null
}

export interface SeatFamilyGroup {
  included_member_limit?: number | null
  extra_seat_count?: number | null
  current_period_end?: string | null
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
  paidActiveExtraSeats: number
  extraSeatsEndingAtPeriodEnd: number
  currentPeriodEnd: string | null
}

export interface ExtraSeatReuseState {
  requiredExtraSeats: number
  paidActiveExtraSeats: number
  reusableExtraSeats: number
  surplusExtraSeats: number
  extraSeatsEndingAtPeriodEnd: number
  currentPeriodEnd: string | null
}

interface SeatCalculationInput {
  activeMembers: SeatMember[]
  pendingInvites: SeatInvite[]
  familyGroup: SeatFamilyGroup | null
  seatAddons?: SeatAddon[]
}

export function getIncludedSeatLimit(familyGroup: SeatFamilyGroup | null): number {
  const limit = Number(familyGroup?.included_member_limit)
  return Number.isFinite(limit) && limit > 0 ? limit : FAMILY_INCLUDED_MEMBER_COUNT
}

export function getExtraSeatPriceINR(): number {
  return FAMILY_EXTRA_MEMBER_PRICE_INR
}

export function getActiveAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return seatAddons
    .filter((addon) => (addon.status || 'active') === 'active')
    .reduce((sum, addon) => sum + Math.max(0, Number(addon.quantity || 0)), 0)
}

export function getEndingAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return seatAddons
    .filter(
      (addon) =>
        (addon.status || 'active') === 'active' &&
        addon.cancel_at_period_end === true
    )
    .reduce((sum, addon) => sum + Math.max(0, Number(addon.quantity || 0)), 0)
}

export function getLatestCurrentPeriodEnd(
  familyGroup: SeatFamilyGroup | null,
  seatAddons: SeatAddon[] = []
): string | null {
  const candidates = [
    familyGroup?.current_period_end || null,
    ...seatAddons.map((addon) => addon.current_period_end || null),
  ].filter(Boolean) as string[]

  if (candidates.length === 0) return null

  return candidates.sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )[0]
}

/**
 * Calculate detailed seat usage for a family group.
 *
 * Billing truth:
 * - Base Family includes 4 invited members.
 * - Required paid extra seats = max(0, active/pending invited people - includedLimit).
 * - Paid extra-seat capacity comes from family_seat_addons.quantity first.
 * - family_groups.extra_seat_count is only a fallback/summary.
 */
export function calculateSeatUsage(input: SeatCalculationInput): SeatUsage {
  const { activeMembers, pendingInvites, familyGroup, seatAddons = [] } = input

  const includedLimit = getIncludedSeatLimit(familyGroup)

  const nonOwnerMembers = activeMembers.filter((member) => member.role !== 'owner')

  const activeIncludedMembers = nonOwnerMembers.filter(
    (member) => (member.seat_type || 'included') === 'included'
  ).length

  const activeExtraMembers = nonOwnerMembers.filter(
    (member) => member.seat_type === 'extra'
  ).length

  const pendingIncludedInvites = pendingInvites.filter(
    (invite) => (invite.seat_type || 'included') === 'included'
  ).length

  const pendingExtraInvites = pendingInvites.filter(
    (invite) => invite.seat_type === 'extra'
  ).length

  const includedSeatsUsed = activeIncludedMembers + pendingIncludedInvites
  const availableIncludedSeats = Math.max(0, includedLimit - includedSeatsUsed)

  const fallbackExtraSeatCount = Math.max(
    0,
    Number(familyGroup?.extra_seat_count || 0)
  )

  const paidFromAddons = getActiveAddonSeatQuantity(seatAddons)

  const paidActiveExtraSeats =
    paidFromAddons > 0 ? paidFromAddons : fallbackExtraSeatCount

  const extraSeatsEndingAtPeriodEnd = getEndingAddonSeatQuantity(seatAddons)

  const totalSeatsUsed =
    activeIncludedMembers +
    activeExtraMembers +
    pendingIncludedInvites +
    pendingExtraInvites

  return {
    includedLimit,
    activeIncludedMembers,
    pendingIncludedInvites,
    includedSeatsUsed,
    availableIncludedSeats,
    extraSeatCount: paidActiveExtraSeats,
    activeExtraMembers,
    pendingExtraInvites,
    totalSeatsUsed,
    paidActiveExtraSeats,
    extraSeatsEndingAtPeriodEnd,
    currentPeriodEnd: getLatestCurrentPeriodEnd(familyGroup, seatAddons),
  }
}

export function areIncludedSeatsFull(seatUsage: SeatUsage): boolean {
  return seatUsage.availableIncludedSeats <= 0
}

export function canInviteWithIncludedSeat(seatUsage: SeatUsage): boolean {
  return seatUsage.availableIncludedSeats > 0
}

export function calculateRequiredExtraSeats(seatUsage: SeatUsage): number {
  return Math.max(0, seatUsage.totalSeatsUsed - seatUsage.includedLimit)
}

export function calculateRequiredExtraSeatsAfterNextInvite(
  seatUsage: SeatUsage
): number {
  return Math.max(0, seatUsage.totalSeatsUsed + 1 - seatUsage.includedLimit)
}

export function calculateExtraSeatReuseState(
  seatUsage: SeatUsage
): ExtraSeatReuseState {
  const requiredExtraSeats = calculateRequiredExtraSeats(seatUsage)
  const paidActiveExtraSeats = seatUsage.paidActiveExtraSeats
  const reusableExtraSeats = Math.max(0, paidActiveExtraSeats - requiredExtraSeats)
  const surplusExtraSeats = reusableExtraSeats

  return {
    requiredExtraSeats,
    paidActiveExtraSeats,
    reusableExtraSeats,
    surplusExtraSeats,
    extraSeatsEndingAtPeriodEnd: seatUsage.extraSeatsEndingAtPeriodEnd,
    currentPeriodEnd: seatUsage.currentPeriodEnd,
  }
}

export function canReusePaidExtraSeatForNextInvite(
  seatUsage: SeatUsage
): boolean {
  const requiredAfterInvite = calculateRequiredExtraSeatsAfterNextInvite(seatUsage)
  return seatUsage.paidActiveExtraSeats >= requiredAfterInvite
}