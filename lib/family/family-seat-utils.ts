import {
  FAMILY_INCLUDED_MEMBER_COUNT,
  FAMILY_EXTRA_MEMBER_PRICE_INR,
  FAMILY_MAX_EXTRA_MEMBER_COUNT,
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
  paidReusableExtraSeats: number
  /** Active extra members + pending extra-seat invites. Pending extra invites reserve paid capacity. */
  reservedExtraSeats: number
  /** Extra-seat count to show/bill after reconciling active add-ons with reserved extra seats. */
  reconciledExtraSeatCount: number
  /** Positive when active/pending extra members exceed the stored paid add-on quantity. */
  unpaidReservedExtraSeats: number
  /** Paid/reconciled capacity still available for another extra invite. */
  availableExtraSeats: number
  extraSeatsEndingAtPeriodEnd: number
  currentPeriodEnd: string | null
}

export interface ExtraSeatReuseState {
  requiredExtraSeats: number
  paidActiveExtraSeats: number
  reusableExtraSeats: number
  surplusExtraSeats: number
  /** Active extra members + pending extra-seat invites. */
  reservedExtraSeats: number
  /** Extra-seat count after reconciling paid capacity with reserved usage. */
  reconciledExtraSeatCount: number
  /** Active paid capacity still available after reserved usage. */
  availableExtraSeats: number
  /** Positive when pending/active extra usage is higher than actual paid add-on rows. */
  unpaidReservedExtraSeats: number
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

function isFutureOrOpenPeriod(addon: SeatAddon): boolean {
  if (!addon.current_period_end) return true
  const end = new Date(addon.current_period_end).getTime()
  return Number.isFinite(end) && end > Date.now()
}

export function clampExtraSeatQuantity(quantity: number): number {
  const safeQuantity = Math.max(0, Number.isFinite(quantity) ? quantity : 0)
  return Math.min(safeQuantity, FAMILY_MAX_EXTRA_MEMBER_COUNT)
}

function sumAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return seatAddons.reduce((sum, addon) => sum + Math.max(0, Number(addon.quantity || 0)), 0)
}

export function getRawActiveAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return sumAddonSeatQuantity(
    seatAddons.filter((addon) => (addon.status || 'active') === 'active' && isFutureOrOpenPeriod(addon))
  )
}

export function getActiveAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return clampExtraSeatQuantity(getRawActiveAddonSeatQuantity(seatAddons))
}

export function getRawReusableAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return sumAddonSeatQuantity(
    seatAddons.filter(
      (addon) =>
        (addon.status || 'active') === 'active' &&
        addon.cancel_at_period_end !== true &&
        isFutureOrOpenPeriod(addon)
    )
  )
}

export function getReusableAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return clampExtraSeatQuantity(getRawReusableAddonSeatQuantity(seatAddons))
}

export function getEndingAddonSeatQuantity(seatAddons: SeatAddon[] = []): number {
  return clampExtraSeatQuantity(
    sumAddonSeatQuantity(
      seatAddons.filter(
        (addon) =>
          (addon.status || 'active') === 'active' &&
          addon.cancel_at_period_end === true
      )
    )
  )
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

  const explicitPendingExtraInvites = pendingInvites.filter(
    (invite) => invite.seat_type === 'extra'
  ).length

  const pendingInvitesWithoutExplicitExtra = Math.max(
    0,
    pendingInvites.length - explicitPendingExtraInvites
  )

  // Older builds sometimes created the 5th+ pending invite without seat_type='extra'.
  // Count only the invites that still fit into remaining included capacity as included;
  // any overflow must reserve extra-seat capacity.
  const includedCapacityAfterActiveMembers = Math.max(0, includedLimit - activeIncludedMembers)
  const pendingIncludedInvites = Math.min(
    pendingInvitesWithoutExplicitExtra,
    includedCapacityAfterActiveMembers
  )
  const overflowPendingInvites = Math.max(
    0,
    pendingInvitesWithoutExplicitExtra - pendingIncludedInvites
  )
  const pendingExtraInvites = clampExtraSeatQuantity(
    explicitPendingExtraInvites + overflowPendingInvites
  )

  const includedSeatsUsed = activeIncludedMembers + pendingIncludedInvites
  const availableIncludedSeats = Math.max(0, includedLimit - includedSeatsUsed)

  // Paid extra-seat capacity must come from active family_seat_addons for payment decisions,
  // but display/billing also needs to account for already-created pending extra invites.
  // Older QA builds allowed extra invites without consistently updating add-on quantity,
  // so active + pending extra seats is the safest reservation count to show.
  const paidActiveExtraSeats = getActiveAddonSeatQuantity(seatAddons)
  const paidReusableExtraSeats = getReusableAddonSeatQuantity(seatAddons)

  const reservedExtraSeats = clampExtraSeatQuantity(activeExtraMembers + pendingExtraInvites)
  const reconciledExtraSeatCount = clampExtraSeatQuantity(
    Math.max(paidActiveExtraSeats, reservedExtraSeats)
  )
  const unpaidReservedExtraSeats = Math.max(0, reservedExtraSeats - paidActiveExtraSeats)
  const availableExtraSeats = Math.max(0, reconciledExtraSeatCount - reservedExtraSeats)

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
    paidReusableExtraSeats,
    reservedExtraSeats,
    reconciledExtraSeatCount,
    unpaidReservedExtraSeats,
    availableExtraSeats,
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
  const paidReusableExtraSeats = seatUsage.paidReusableExtraSeats
  const reservedExtraSeats = seatUsage.reservedExtraSeats
  const reconciledExtraSeatCount = seatUsage.reconciledExtraSeatCount

  // Available capacity should never ignore pending extra invites. Older builds could
  // create pending extra invites after payment, so reserve those seats until accepted,
  // cancelled, or expired.
  const reusableExtraSeats = Math.max(0, reconciledExtraSeatCount - reservedExtraSeats)
  const surplusExtraSeats = reusableExtraSeats

  return {
    requiredExtraSeats,
    paidActiveExtraSeats,
    reusableExtraSeats,
    surplusExtraSeats,
    reservedExtraSeats,
    reconciledExtraSeatCount,
    availableExtraSeats: reusableExtraSeats,
    unpaidReservedExtraSeats: Math.max(0, reservedExtraSeats - paidActiveExtraSeats),
    extraSeatsEndingAtPeriodEnd: seatUsage.extraSeatsEndingAtPeriodEnd,
    currentPeriodEnd: seatUsage.currentPeriodEnd,
  }
}

export function canReusePaidExtraSeatForNextInvite(
  seatUsage: SeatUsage
): boolean {
  const requiredAfterInvite = calculateRequiredExtraSeatsAfterNextInvite(seatUsage)
  return seatUsage.paidReusableExtraSeats >= requiredAfterInvite
}