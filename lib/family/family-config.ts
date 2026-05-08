/**
 * Family Plan Configuration
 * Central place for family plan rules, constants, and types.
 */

export const FAMILY_PLAN_ENABLED =
  process.env.NEXT_PUBLIC_FAMILY_PLAN_ENABLED === 'true'

export const FAMILY_INCLUDED_MEMBER_COUNT = 4
export const FAMILY_MAX_EXTRA_MEMBER_COUNT = 4
export const FAMILY_MAX_INVITED_MEMBER_COUNT =
  FAMILY_INCLUDED_MEMBER_COUNT + FAMILY_MAX_EXTRA_MEMBER_COUNT

export const FAMILY_EXTRA_MEMBER_PRICE_INR = 99
export const FAMILY_EXTRA_MEMBER_PRICE_USD = 1.49
export const FAMILY_INVITE_EXPIRY_DAYS = 7

/**
 * Family group status lifecycle:
 * - active: Paying subscription, members can access
 * - past_due: Payment failed, members retain access
 * - cancelled: Subscription cancelled, members lose access
 */
export type FamilyGroupStatus = 'active' | 'past_due' | 'cancelled'

/**
 * Member role in the family group:
 * - owner: Created the family group, can manage members
 * - member: Invited to the family group
 */
export type FamilyMemberRole = 'owner' | 'member'

/**
 * Member status within family:
 * - active: Current member with access
 * - removed: Owner removed them, no access
 */
export type FamilyMemberStatus = 'active' | 'removed'

/**
 * Invite status lifecycle:
 * - pending: Invitation sent, not yet accepted
 * - accepted: Invite accepted, member joined
 * - expired: Invite not accepted within 7 days
 * - cancelled: Owner cancelled the invite
 */
export type FamilyInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

/**
 * Seat type for billing:
 * - owner: Owner's seat
 * - included: First 4 invited members included in Family
 * - extra: 5th+ invited members covered by paid extra seats
 */
export type FamilySeatType = 'owner' | 'included' | 'extra'

/**
 * Seat add-on status:
 * - active: Active paid extra-seat capacity
 * - cancelled: Cancelled extra-seat capacity
 * - past_due: Payment failed, grace state
 */
export type FamilySeatAddonStatus = 'active' | 'cancelled' | 'past_due'

export const FAMILY_PLAN_RULES = {
  includedMembers: FAMILY_INCLUDED_MEMBER_COUNT,
  maxExtraMembers: FAMILY_MAX_EXTRA_MEMBER_COUNT,
  maxInvitedMembers: FAMILY_MAX_INVITED_MEMBER_COUNT,
  extraMemberPriceINR: FAMILY_EXTRA_MEMBER_PRICE_INR,
  extraMemberPriceUSD: FAMILY_EXTRA_MEMBER_PRICE_USD,
  inviteExpiryDays: FAMILY_INVITE_EXPIRY_DAYS,
  inviteAcceptance:
    'Invite can be accepted from email link or direct sign-in when auth email matches invited email.',
  authDirection: 'Google/Apple-first, mostly Google.',
} as const