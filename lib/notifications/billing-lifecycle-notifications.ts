// N2: Billing and Family lifecycle notification helpers

import { createNotification } from '@/lib/supabase/repositories/notifications'
import { NOTIFICATION_TEMPLATES } from './notification-types'
import type { SubscriptionRow } from '@/lib/supabase/database.types'

// N2: Notify owner when Family member joins
export async function createFamilyMemberJoinedNotification(
  ownerId: string,
  memberName: string,
  memberCount: number
) {
  const template = NOTIFICATION_TEMPLATES.family_member_joined
  const metadata = { memberName, memberCount }
  
  try {
    await createNotification({
      user_id: ownerId,
      type: 'family_member_joined',
      source: 'family',
      source_id: `family:member_joined:${memberName}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create family member joined notification:', error)
  }
}

// N2: Notify owner when Family member leaves
export async function createFamilyMemberLeftNotification(
  ownerId: string,
  memberName: string,
  memberCount: number
) {
  const template = NOTIFICATION_TEMPLATES.family_member_left
  const metadata = { memberName, memberCount }
  
  try {
    await createNotification({
      user_id: ownerId,
      type: 'family_member_left',
      source: 'family',
      source_id: `family:member_left:${memberName}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create family member left notification:', error)
  }
}

// N2: Notify member when removed from Family
export async function createFamilyMemberRemovedNotification(
  memberId: string,
  ownerName: string
) {
  const template = NOTIFICATION_TEMPLATES.family_member_removed
  const metadata = { ownerName }
  
  try {
    await createNotification({
      user_id: memberId,
      type: 'family_member_removed',
      source: 'family',
      source_id: `family:removed:${memberId}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create family member removed notification:', error)
  }
}

// N2: Notify member when Family access is ending (scheduled cancellation)
export async function createFamilyAccessEndingNotification(
  memberId: string,
  accessEndsAt: string
) {
  const template = NOTIFICATION_TEMPLATES.family_access_ending
  const formattedDate = new Date(accessEndsAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const metadata = { accessEndsAt: formattedDate }
  
  try {
    await createNotification({
      user_id: memberId,
      type: 'family_access_ending',
      source: 'family',
      source_id: `family:access_ending:${memberId}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create family access ending notification:', error)
  }
}

// N2: Notify owner when extra seat is added
export async function createExtraSeatAddedNotification(
  ownerId: string,
  seatCount: number,
  pricePerSeat: number = 99
) {
  const template = NOTIFICATION_TEMPLATES.extra_seat_added
  const totalAmount = seatCount * pricePerSeat
  const metadata = { seatCount, amount: totalAmount }
  
  try {
    await createNotification({
      user_id: ownerId,
      type: 'extra_seat_added',
      source: 'billing',
      source_id: `billing:extra_seat_added:${seatCount}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create extra seat added notification:', error)
  }
}

// N2: Notify subscription renewal success
export async function createSubscriptionRenewedNotification(
  userId: string,
  subscription: SubscriptionRow
) {
  const template = NOTIFICATION_TEMPLATES.subscription_renewed
  const metadata = {
    subscription_id: subscription.id,
    name: subscription.name,
    amount: subscription.amount,
  }
  
  try {
    await createNotification({
      user_id: userId,
      type: 'subscription_renewed',
      source: 'billing',
      source_id: `billing:renewed:${subscription.id}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create subscription renewed notification:', error)
  }
}

// N2: Notify billing failure
export async function createBillingFailedNotification(
  userId: string,
  subscriptionName: string
) {
  const template = NOTIFICATION_TEMPLATES.billing_failed
  const metadata = { subscriptionName }
  
  try {
    await createNotification({
      user_id: userId,
      type: 'billing_failed',
      source: 'billing',
      source_id: `billing:failed:${Date.now()}`,
      title: template.title(metadata),
      message: template.message(metadata),
      category: template.category,
      priority: template.priority,
      action_url: template.actionUrl?.(metadata),
      metadata,
      expires_at: new Date(Date.now() + template.retentionDays * 24 * 60 * 60 * 1000),
    })
  } catch (error) {
    console.warn('[N2] Failed to create billing failed notification:', error)
  }
}
