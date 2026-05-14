'use client'

/**
 * S5B.3-R: Derive a Family invite notification from familyStatus.
 * This is a client-side helper that creates a notification object
 * from the pendingInvite data returned by /api/family/status.
 *
 * Source of truth: /api/family/status.pendingInvite
 * Local state: localStorage for read/dismiss tracking
 */

interface FamilyStatus {
  pendingInvite?: {
    id: string
    invitedEmail: string
    expiresAt: string
    seatType: string
    createdAt?: string
  }
  familyGroupId?: string
  familyOwner?: {
    email: string | null
    userId?: string
  }
}

export interface DerivedNotification {
  id: string
  type: 'info'
  title: string
  message: string
  date: string
  read: boolean
  actionHref: string
}

/**
 * Derive a Family invite notification from familyStatus.
 * Returns null if no pending invite exists.
 */
export function deriveFamilyInviteNotification(
  familyStatus: FamilyStatus | null
): DerivedNotification | null {
  if (!familyStatus?.pendingInvite) {
    return null
  }

  const notificationId = `family-invite-${familyStatus.pendingInvite.id}`
  const ownerEmail = familyStatus.familyOwner?.email || 'A Family owner'

  return {
    id: notificationId,
    type: 'info',
    title: 'Renewly Family invite',
    message: `${ownerEmail} invited you to join their Renewly Family plan.`,
    date: familyStatus.pendingInvite.createdAt || familyStatus.pendingInvite.expiresAt,
    read: isNotificationRead(notificationId),
    actionHref: '/app/family',
  }
}

/**
 * Check if a notification is marked as read in localStorage.
 * Uses a simple key-value store scoped by notification id.
 */
function isNotificationRead(notificationId: string): boolean {
  if (typeof window === 'undefined') return false

  try {
    const readState = localStorage.getItem(`renewly_notification_read_${notificationId}`)
    return readState === 'true'
  } catch {
    return false
  }
}

/**
 * Mark a notification as read in localStorage.
 * Should be called when user clicks/dismisses the notification.
 */
export function markDerivedNotificationRead(notificationId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(`renewly_notification_read_${notificationId}`, 'true')
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear the read state for a notification.
 * Useful when a new invite appears (different ID) to show it as unread.
 */
export function clearDerivedNotificationState(notificationId: string): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(`renewly_notification_read_${notificationId}`)
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
