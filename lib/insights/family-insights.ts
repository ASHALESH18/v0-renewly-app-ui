/**
 * Family Insights - Rule-based insights for Family plan capacity
 */

import type { Insight, InsightGenerationContext } from './insight-types'
import { createInsight } from './insight-engine'

export function generateFamilyInsights(context: InsightGenerationContext): Insight[] {
  const insights: Insight[] = []
  const { familyStatus } = context

  if (!familyStatus) return insights

  // INSIGHT 1: Pending extra-seat capacity
  if (
    familyStatus.seatUsage?.paidActiveExtraSeats &&
    familyStatus.seatUsage.paidActiveExtraSeats > 0 &&
    familyStatus.seatUsage.pendingExtraInvites &&
    familyStatus.seatUsage.pendingExtraInvites > 0
  ) {
    const usedOrReserved =
      (familyStatus.seatUsage.activeExtraMembers || 0) +
      (familyStatus.seatUsage.pendingExtraInvites || 0)
    const available = Math.max(0, (familyStatus.seatUsage.paidActiveExtraSeats || 0) - usedOrReserved)

    insights.push(
      createInsight({
        id: 'family_pending_extra_capacity',
        type: 'pending_extra_seat_capacity',
        category: 'family',
        severity: available === 0 ? 'warning' : 'info',
        title: 'Extra seats are reserved by pending invites',
        summary: `You have ${familyStatus.seatUsage.pendingExtraInvites} pending extra-seat invite${familyStatus.seatUsage.pendingExtraInvites !== 1 ? 's' : ''} that reserve your capacity.`,
        evidence: [
          `${familyStatus.seatUsage.activeExtraMembers || 0} active extra member${(familyStatus.seatUsage.activeExtraMembers || 0) !== 1 ? 's' : ''}`,
          `${familyStatus.seatUsage.pendingExtraInvites || 0} pending extra invite${familyStatus.seatUsage.pendingExtraInvites !== 1 ? 's' : ''}`,
          `${familyStatus.seatUsage.paidActiveExtraSeats || 0} total paid seat${(familyStatus.seatUsage.paidActiveExtraSeats || 0) !== 1 ? 's' : ''}`,
          available === 0 ? 'No seats available until invites are accepted/rejected' : `${available} seat${available !== 1 ? 's' : ''} available after pending`,
        ],
        recommendation:
          available === 0
            ? 'Review and accept/reject pending invites to free up capacity.'
            : 'Check pending invites to decide whether to keep this capacity.',
        actionLabel: 'Review Family',
        actionUrl: '/app/family',
        confidence: 95,
        source: 'family_capacity',
      })
    )
  }

  // INSIGHT 2: Unused paid extra seats
  const usedOrReserved2 =
    (familyStatus.seatUsage?.activeExtraMembers || 0) +
    (familyStatus.seatUsage?.pendingExtraInvites || 0)
  const available2 = Math.max(0, (familyStatus.seatUsage?.paidActiveExtraSeats || 0) - usedOrReserved2)

  if (available2 > 1 && familyStatus.isOwner) {
    insights.push(
      createInsight({
        id: 'family_unused_extra_capacity',
        type: 'unused_extra_seat_capacity',
        category: 'family',
        severity: 'info',
        title: `You have ${available2} unused extra seat${available2 !== 1 ? 's' : ''}`,
        summary: `Your Family plan has paid capacity that isn't being used.`,
        evidence: [
          `${available2} extra seat${available2 !== 1 ? 's' : ''} not assigned`,
          `${familyStatus.seatUsage?.activeExtraMembers || 0} active user${(familyStatus.seatUsage?.activeExtraMembers || 0) !== 1 ? 's' : ''}`,
          `Costing ₹${(available2 * 99).toLocaleString('en-IN')} per month`,
        ],
        recommendation:
          'Invite another member to use this capacity, or schedule cancellation for unused seats.',
        actionLabel: 'View Family',
        actionUrl: '/app/family',
        confidence: 85,
        source: 'family_capacity',
      })
    )
  }

  // INSIGHT 3: Family max reached
  const totalMembers =
    (familyStatus.seatUsage?.activeIncludedMembers || 0) +
    (familyStatus.seatUsage?.activeExtraMembers || 0) +
    (familyStatus.seatUsage?.pendingIncludedInvites || 0) +
    (familyStatus.seatUsage?.pendingExtraInvites || 0)

  if (totalMembers >= 9 && familyStatus.isOwner) {
    insights.push(
      createInsight({
        id: 'family_max_capacity_reached',
        type: 'family_max_reached',
        category: 'family',
        severity: 'warning',
        title: 'Family plan is at maximum capacity',
        summary: 'Your Family plan (owner + 8 members) is fully booked.',
        evidence: [
          `${totalMembers} total members (1 owner + 8 maximum)`,
          'Cannot invite new members until slots open up',
          'Consider removing inactive members or declining pending invites',
        ],
        recommendation: 'Remove inactive members or decline pending invites before adding more.',
        actionLabel: 'Manage Family',
        actionUrl: '/app/family',
        confidence: 100,
        source: 'family_capacity',
      })
    )
  }

  // INSIGHT 4: Scheduled extra-seat cancellation
  const hasCancelledAddons =
    familyStatus.seatAddons?.some((addon) => addon.cancelAtPeriodEnd) || false

  if (hasCancelledAddons) {
    const cancelledAddon = familyStatus.seatAddons?.find((addon) => addon.cancelAtPeriodEnd)
    const endDate = cancelledAddon?.currentPeriodEnd
      ? new Date(cancelledAddon.currentPeriodEnd).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : 'end of period'

    insights.push(
      createInsight({
        id: 'family_cancellation_scheduled',
        type: 'scheduled_extra_seat_cancellation',
        category: 'family',
        severity: 'warning',
        title: 'Extra-seat cancellation is scheduled',
        summary: 'You have scheduled the cancellation of extra Family seats.',
        evidence: [
          `Cancellation scheduled for ${endDate}`,
          `Current active extra: ${familyStatus.seatUsage?.activeExtraMembers || 0} member${(familyStatus.seatUsage?.activeExtraMembers || 0) !== 1 ? 's' : ''}`,
          'You can undo this cancellation anytime',
        ],
        recommendation: 'Undo the cancellation if you still need this capacity.',
        actionLabel: 'Manage Family',
        actionUrl: '/app/family',
        confidence: 100,
        source: 'family_capacity',
      })
    )
  }

  // INSIGHT 5: Covered Family member info
  if (familyStatus.isCoveredMember && !familyStatus.isOwner) {
    insights.push(
      createInsight({
        id: 'family_covered_member_info',
        type: 'covered_member_insight',
        category: 'family',
        severity: 'info',
        title: 'Your access is covered by Family',
        summary:
          'The Family owner manages billing. You can start your own plan anytime by upgrading in Settings.',
        evidence: [
          'No billing charges for your account',
          'All subscriptions are managed by the Family owner',
          'You can leave the Family plan at any time',
        ],
        recommendation: 'You can continue as a covered member or start your own independent plan.',
        actionLabel: 'View Settings',
        actionUrl: '/app/settings',
        confidence: 95,
        source: 'family_status',
      })
    )
  }

  return insights
}
