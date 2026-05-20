import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/notification-service'
import type { NotificationType, NotificationCategory } from '@/lib/notifications/notification-types'

const ALLOWED_QA_EMAILS = ['test@renewly.in', 'qa@renewly.in', 'preview@renewly.in']

type ScenarioType =
  | 'family_invite_received'
  | 'family_invite_accepted'
  | 'family_invite_declined'
  | 'extra_seat_cancel_scheduled'
  | 'extra_seat_cancel_undone'
  | 'billing_amount_changed'
  | 'renewal_due_soon'
  | 'renewal_due_today'
  | 'system_test'

interface QANotificationRequest {
  scenario: ScenarioType
  targetEmail: string
  ownerEmail?: string
  metadata?: Record<string, any>
}

interface QANotificationResponse {
  success: boolean
  scenario: ScenarioType
  notificationIds: string[]
  targetUserId?: string
  ownerUserId?: string
  errors: string[]
}

// Check if we're in preview/development
function isPreviewOrDev(): boolean {
  const vercelEnv = process.env.VERCEL_ENV || 'development'
  // Only allow in preview or development, NOT on custom domain production
  return vercelEnv === 'preview' || vercelEnv === 'development'
}

export async function POST(request: NextRequest): Promise<NextResponse<QANotificationResponse>> {
  try {
    // PART B: Only allow in preview/dev
    if (!isPreviewOrDev()) {
      return NextResponse.json(
        {
          success: false,
          scenario: 'system_test',
          notificationIds: [],
          errors: ['QA notifications only available in preview/development'],
        } as QANotificationResponse,
        { status: 403 }
      )
    }

    const body = (await request.json()) as QANotificationRequest
    const { scenario, targetEmail, ownerEmail, metadata = {} } = body

    if (!scenario || !targetEmail) {
      return NextResponse.json(
        {
          success: false,
          scenario: scenario || 'system_test',
          notificationIds: [],
          errors: ['Missing scenario or targetEmail'],
        } as QANotificationResponse,
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get target user
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('email', targetEmail)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        {
          success: false,
          scenario,
          notificationIds: [],
          errors: [`Target user not found: ${targetEmail}`],
        } as QANotificationResponse,
        { status: 404 }
      )
    }

    let ownerUser: any = null
    if (ownerEmail) {
      const { data: owner, error: ownerError } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', ownerEmail)
        .single()

      if (ownerError || !owner) {
        return NextResponse.json(
          {
            success: false,
            scenario,
            notificationIds: [],
            targetUserId: targetUser.id,
            errors: [`Owner user not found: ${ownerEmail}`],
          } as QANotificationResponse,
          { status: 404 }
        )
      }
      ownerUser = owner
    }

    const notificationIds: string[] = []
    const errors: string[] = []

    // PART C: Generate notifications based on scenario with idempotency keys
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    try {
      if (scenario === 'family_invite_received') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'family_invite' as NotificationType,
          title: `${ownerEmail || 'Family owner'} invited you to their Family`,
          message: 'Review your Family invitation.',
          category: 'family' as NotificationCategory,
          severity: 'info',
          actionUrl: '/app/family',
          entityType: 'family_invite',
          entityId: `qa-invite-${targetUser.id}-${dateStr}`,
          metadata: { ownerEmail, ...metadata },
          idempotencyKey: `family_invite_received:qa:${targetUser.id}:${dateStr}`,
        })
        if (notif) notificationIds.push(notif.id)
      }

      if (scenario === 'family_invite_accepted') {
        if (!ownerUser) {
          errors.push('ownerEmail required for family_invite_accepted')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'family_member_joined' as NotificationType,
            title: `${targetEmail} accepted your Family invitation`,
            message: 'They now have access to your subscription.',
            category: 'family' as NotificationCategory,
            severity: 'info',
            actionUrl: '/app/family',
            entityType: 'family_member',
            entityId: targetUser.id,
            metadata: { memberEmail: targetEmail, ...metadata },
            idempotencyKey: `family_invite_accepted:qa:${ownerUser.id}:${targetUser.id}:${dateStr}`,
          })
          if (notif) notificationIds.push(notif.id)
        }
      }

      if (scenario === 'family_invite_declined') {
        if (!ownerUser) {
          errors.push('ownerEmail required for family_invite_declined')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'family_member_left' as NotificationType,
            title: `${targetEmail} declined your Family invitation`,
            message: 'They did not accept your invitation.',
            category: 'family' as NotificationCategory,
            severity: 'info',
            actionUrl: '/app/family',
            entityType: 'family_invite',
            entityId: `qa-invite-${ownerUser.id}-${dateStr}`,
            metadata: { memberEmail: targetEmail, ...metadata },
            idempotencyKey: `family_invite_declined:qa:${ownerUser.id}:${targetUser.id}:${dateStr}`,
          })
          if (notif) notificationIds.push(notif.id)
        }
      }

      if (scenario === 'extra_seat_cancel_scheduled') {
        if (!ownerUser) {
          errors.push('ownerEmail required for extra_seat_cancel_scheduled')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'extra_seat_removed' as NotificationType,
            title: 'Extra seat cancellation scheduled',
            message: 'One extra seat will be removed at the end of your billing period.',
            category: 'billing' as NotificationCategory,
            severity: 'warning',
            actionUrl: '/app/family',
            metadata: { targetEmail, ...metadata },
            idempotencyKey: `extra_seat_cancel_scheduled:qa:${ownerUser.id}:${dateStr}`,
          })
          if (notif) notificationIds.push(notif.id)
        }
      }

      if (scenario === 'extra_seat_cancel_undone') {
        if (!ownerUser) {
          errors.push('ownerEmail required for extra_seat_cancel_undone')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'extra_seat_added' as NotificationType,
            title: 'Extra seat cancellation undone',
            message: 'The extra seat will continue at the end of your billing period.',
            category: 'billing' as NotificationCategory,
            severity: 'info',
            actionUrl: '/app/family',
            metadata: { targetEmail, ...metadata },
            idempotencyKey: `extra_seat_cancel_undone:qa:${ownerUser.id}:${dateStr}`,
          })
          if (notif) notificationIds.push(notif.id)
        }
      }

      if (scenario === 'billing_amount_changed') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'subscription_renewed' as NotificationType,
          title: 'Your billing amount has changed',
          message: `New amount: ₹${metadata.newAmount || '299'}/month`,
          category: 'billing' as NotificationCategory,
          severity: 'info',
          actionUrl: '/app/settings',
          metadata: { ...metadata },
          idempotencyKey: `billing_amount_changed:qa:${targetUser.id}:${metadata.newAmount}:${dateStr}`,
        })
        if (notif) notificationIds.push(notif.id)
      }

      if (scenario === 'renewal_due_soon') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'renewal_7day' as NotificationType,
          title: 'Subscription renewal coming up',
          message: `Your subscription renews in ${metadata.daysUntil || 7} days.`,
          category: 'renewals' as NotificationCategory,
          severity: 'info',
          actionUrl: '/app/subscriptions',
          metadata: { ...metadata },
          idempotencyKey: `renewal_due_soon:qa:${targetUser.id}:${metadata.daysUntil || 7}:${dateStr}`,
        })
        if (notif) notificationIds.push(notif.id)
      }

      if (scenario === 'renewal_due_today') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'renewal_today' as NotificationType,
          title: 'Subscription renewing today',
          message: 'Your subscription will renew today.',
          category: 'renewals' as NotificationCategory,
          severity: 'high',
          actionUrl: '/app/subscriptions',
          metadata: { ...metadata },
          idempotencyKey: `renewal_due_today:qa:${targetUser.id}:${dateStr}`,
        })
        if (notif) notificationIds.push(notif.id)
      }

      if (scenario === 'system_test') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'feature_released' as NotificationType,
          title: 'QA Test Notification',
          message: 'This is a test notification from the QA API.',
          category: 'system' as NotificationCategory,
          severity: 'info',
          actionUrl: '/app/notifications',
          metadata: { qaTest: true, ...metadata },
          idempotencyKey: `system_test:qa:${targetUser.id}:${now.getTime()}`,
        })
        if (notif) notificationIds.push(notif.id)
      }
    } catch (error) {
      errors.push(`Failed to create notification: ${error instanceof Error ? error.message : 'unknown error'}`)
    }

    return NextResponse.json(
      {
        success: notificationIds.length > 0 && errors.length === 0,
        scenario,
        notificationIds,
        targetUserId: targetUser.id,
        ownerUserId: ownerUser?.id,
        errors,
      } as QANotificationResponse,
      { status: errors.length > 0 && notificationIds.length === 0 ? 400 : 200 }
    )
  } catch (error) {
    console.error('[qa/notifications] Error:', error)
    return NextResponse.json(
      {
        success: false,
        scenario: 'system_test',
        notificationIds: [],
        errors: [error instanceof Error ? error.message : 'unknown error'],
      } as QANotificationResponse,
      { status: 500 }
    )
  }
}
