import { createNotification } from '@/lib/supabase/repositories/notifications'
import type { Notification } from '@/lib/supabase/repositories/notifications'

export interface CreateFamilyInviteNotificationParams {
  userId: string
  invitedEmail?: string
  inviterName?: string
  familyGroupId: string
  inviteId: string
}

/**
 * F8-lite: Create or update a persistent family invite notification
 * 
 * When a user is invited to a family:
 * - If user exists: Create unread notification
 * - If user doesn't exist: Store with email metadata for later
 * 
 * Notifications prevent duplicates via unique(user_id, source, source_id)
 */
export async function createFamilyInviteNotification(
  params: CreateFamilyInviteNotificationParams
): Promise<Notification> {
  const { userId, invitedEmail, inviterName, familyGroupId, inviteId } = params

  return createNotification(userId, {
    type: 'family_invite',
    source: 'family_invite',
    source_id: inviteId,
    title: 'Family Invite Received',
    message: inviterName
      ? `${inviterName} invited you to join their family on Renewly`
      : 'You have been invited to join a family on Renewly',
    action_url: `/app/family?invite_id=${inviteId}`,
    action_label: 'View Invite',
    status: 'unread',
    metadata: {
      family_group_id: familyGroupId,
      invite_id: inviteId,
      invited_email: invitedEmail,
      inviter_name: inviterName,
      created_at: new Date().toISOString(),
    },
    // F8-lite: Expire after 30 days if not acted on
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  })
}

/**
 * F8-lite: Create notification for family owner when member joins/accepts invite
 */
export async function createFamilyMemberJoinedNotification(
  ownerUserId: string,
  memberName: string,
  familyGroupId: string,
  memberId: string
): Promise<Notification> {
  return createNotification(ownerUserId, {
    type: 'family_member_joined',
    source: 'family_invite',
    source_id: `member_joined_${memberId}`,
    title: 'Family Member Added',
    message: `${memberName} has joined your family`,
    action_url: `/app/family`,
    action_label: 'View Family',
    status: 'unread',
    metadata: {
      family_group_id: familyGroupId,
      member_id: memberId,
      member_name: memberName,
      created_at: new Date().toISOString(),
    },
  })
}

/**
 * F8-lite: Create notification for family owner when member leaves
 */
export async function createFamilyMemberLeftNotification(
  ownerUserId: string,
  memberName: string,
  familyGroupId: string,
  memberId: string
): Promise<Notification> {
  return createNotification(ownerUserId, {
    type: 'family_member_left',
    source: 'family_invite',
    source_id: `member_left_${memberId}`,
    title: 'Family Member Left',
    message: `${memberName} has left your family`,
    action_url: `/app/family`,
    action_label: 'View Family',
    status: 'unread',
    metadata: {
      family_group_id: familyGroupId,
      member_id: memberId,
      member_name: memberName,
      created_at: new Date().toISOString(),
    },
  })
}
