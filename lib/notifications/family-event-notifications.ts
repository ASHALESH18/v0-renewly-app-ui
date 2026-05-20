// Combo 5: Family notification event helpers
// Called after successful family operations to create persistent notifications

import { createNotification } from './notification-service'

export async function notifyFamilyInviteReceived(
  recipientUserId: string | null,
  recipientEmail: string,
  ownerName: string,
  ownerEmail: string,
  familyGroupId: string,
  inviteId: string
) {
  // Only notify if we have a user ID
  if (!recipientUserId) {
    console.log(`[notifications] Skipping family_invite_received (no user_id for ${recipientEmail})`)
    return
  }

  await createNotification({
    userId: recipientUserId,
    type: 'family_invite',
    title: `${ownerName} invited you to Renewly Family`,
    message: 'Join to get included in their subscription plan.',
    category: 'family',
    severity: 'info',
    actionUrl: '/app/family',
    entityType: 'family_invite',
    entityId: inviteId,
    idempotencyKey: `family_invite_received:${inviteId}:${recipientUserId}`,
    metadata: {
      ownerName,
      ownerEmail,
      familyGroupId,
      inviteId,
      recipientEmail,
    },
  })
}

export async function notifyFamilyInviteAccepted(
  ownerUserId: string,
  memberName: string,
  memberEmail: string,
  familyGroupId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'family_member_joined',
    title: `${memberName} joined your Renewly Family`,
    message: 'You now have 1 more member included in your plan.',
    category: 'family',
    severity: 'info',
    actionUrl: '/app/family',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `family_invite_accepted:${familyGroupId}:${memberEmail}`,
    metadata: {
      memberName,
      memberEmail,
      familyGroupId,
    },
  })
}

export async function notifyFamilyInviteDeclined(
  ownerUserId: string,
  memberEmail: string,
  familyGroupId: string,
  inviteId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'family_invite',
    title: `${memberEmail} declined your Renewly Family invite`,
    message: 'They did not accept your invitation to join.',
    category: 'family',
    severity: 'warning',
    actionUrl: '/app/family',
    entityType: 'family_invite',
    entityId: inviteId,
    idempotencyKey: `family_invite_declined:${inviteId}`,
    metadata: {
      memberEmail,
      familyGroupId,
      inviteId,
    },
  })
}

export async function notifyFamilyMemberRemoved(
  memberUserId: string | null,
  memberEmail: string,
  ownerName: string,
  familyGroupId: string
) {
  if (!memberUserId) {
    console.log(`[notifications] Skipping family_member_removed (no user_id for ${memberEmail})`)
    return
  }

  await createNotification({
    userId: memberUserId,
    type: 'family_member_removed',
    title: `${ownerName} removed you from Renewly Family`,
    message: 'You no longer have access to their subscription plan.',
    category: 'family',
    severity: 'warning',
    actionUrl: '/app/upgrade',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `family_member_removed:${familyGroupId}:${memberUserId}`,
    metadata: {
      ownerName,
      memberEmail,
      familyGroupId,
    },
  })
}

export async function notifyFamilyMemberLeft(
  ownerUserId: string,
  memberName: string,
  memberEmail: string,
  familyGroupId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'family_member_left',
    title: `${memberName} left your Renewly Family`,
    message: 'They no longer have access to your subscription plan.',
    category: 'family',
    severity: 'info',
    actionUrl: '/app/family',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `family_member_left:${familyGroupId}:${memberEmail}`,
    metadata: {
      memberName,
      memberEmail,
      familyGroupId,
    },
  })
}

export async function notifyExtraSeatPurchased(
  ownerUserId: string,
  quantity: number,
  amountInr: number,
  familyGroupId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'extra_seat_added',
    title: `${quantity} extra seat(s) added to your Family`,
    message: `Now ₹${amountInr}/month for ${quantity} additional seat(s)`,
    category: 'billing',
    severity: 'info',
    actionUrl: '/app/family',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `extra_seat_purchased:${familyGroupId}:${Date.now()}`,
    metadata: {
      quantity,
      amountInr,
      familyGroupId,
    },
  })
}

export async function notifyExtraSeatCancellationScheduled(
  ownerUserId: string,
  quantity: number,
  effectiveDate: string,
  familyGroupId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'extra_seat_removed',
    title: `${quantity} extra seat(s) cancellation scheduled`,
    message: `Will be removed effective ${effectiveDate}. Undo cancellation in Family settings.`,
    category: 'billing',
    severity: 'warning',
    actionUrl: '/app/family',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `extra_seat_cancel_scheduled:${familyGroupId}:${quantity}`,
    metadata: {
      quantity,
      effectiveDate,
      familyGroupId,
    },
  })
}

export async function notifyExtraSeatCancellationReversed(
  ownerUserId: string,
  quantity: number,
  familyGroupId: string
) {
  await createNotification({
    userId: ownerUserId,
    type: 'extra_seat_added',
    title: `${quantity} extra seat(s) cancellation reversed`,
    message: 'Your extra seats will continue at the next renewal.',
    category: 'billing',
    severity: 'info',
    actionUrl: '/app/family',
    entityType: 'family_group',
    entityId: familyGroupId,
    idempotencyKey: `extra_seat_cancel_reversed:${familyGroupId}:${quantity}`,
    metadata: {
      quantity,
      familyGroupId,
    },
  })
}
