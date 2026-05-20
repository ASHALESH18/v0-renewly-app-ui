import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNotification } from '@/lib/notifications/notification-service'

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
    // Only allow in preview/dev
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

    // Generate notifications based on scenario with source/sourceId for idempotency
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]

    try {
      if (scenario === 'family_invite_received') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'family_invite',
          title: `${ownerEmail || 'Family owner'} invited you to their Family`,
          message: 'Review your Family invitation and join their Renewly Family plan.',
          source: 'family_invite',
          sourceId: `qa-invite-${targetUser.id}-${dateStr}`,
          actionUrl: '/app/family',
          actionLabel: 'View Invitation',
          metadata: { ownerEmail, ...metadata },
        })
        if (notif) notificationIds.push(notif.id)
        else errors.push('Failed to create family_invite_received notification')
      }

      if (scenario === 'family_invite_accepted') {
        if (!ownerUser) {
          errors.push('ownerEmail required for family_invite_accepted')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'family_member_joined',
            title: `${targetEmail} accepted your Family invitation`,
            message: 'They now have access to your Family plan and subscriptions.',
            source: 'family_invite',
            sourceId: `qa-accepted-${ownerUser.id}-${targetUser.id}-${dateStr}`,
            actionUrl: '/app/family',
            actionLabel: 'View Family',
            metadata: { memberEmail: targetEmail, ...metadata },
          })
          if (notif) notificationIds.push(notif.id)
          else errors.push('Failed to create family_invite_accepted notification')
        }
      }

      if (scenario === 'family_invite_declined') {
        if (!ownerUser) {
          errors.push('ownerEmail required for family_invite_declined')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'family_member_left',
            title: `${targetEmail} declined your Family invitation`,
            message: 'They did not accept your invitation to join.',
            source: 'family_invite',
            sourceId: `qa-declined-${ownerUser.id}-${targetUser.id}-${dateStr}`,
            actionUrl: '/app/family',
            actionLabel: 'View Family',
            metadata: { memberEmail: targetEmail, ...metadata },
          })
          if (notif) notificationIds.push(notif.id)
          else errors.push('Failed to create family_invite_declined notification')
        }
      }

      if (scenario === 'extra_seat_cancel_scheduled') {
        if (!ownerUser) {
          errors.push('ownerEmail required for extra_seat_cancel_scheduled')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'subscription_reminder',
            title: 'Extra seat cancellation scheduled',
            message: 'One extra seat will be removed at the end of your billing period.',
            source: 'billing',
            sourceId: `qa-seat-cancel-${ownerUser.id}-${dateStr}`,
            actionUrl: '/app/family',
            actionLabel: 'View Family',
            metadata: { ...metadata },
          })
          if (notif) notificationIds.push(notif.id)
          else errors.push('Failed to create extra_seat_cancel_scheduled notification')
        }
      }

      if (scenario === 'extra_seat_cancel_undone') {
        if (!ownerUser) {
          errors.push('ownerEmail required for extra_seat_cancel_undone')
        } else {
          const notif = await createNotification({
            userId: ownerUser.id,
            type: 'subscription_reminder',
            title: 'Extra seat cancellation undone',
            message: 'The extra seat will continue at the end of your billing period.',
            source: 'billing',
            sourceId: `qa-seat-undo-${ownerUser.id}-${dateStr}`,
            actionUrl: '/app/family',
            actionLabel: 'View Family',
            metadata: { ...metadata },
          })
          if (notif) notificationIds.push(notif.id)
          else errors.push('Failed to create extra_seat_cancel_undone notification')
        }
      }

      if (scenario === 'billing_amount_changed') {
        const amount = metadata?.newAmount || '299'
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'payment_issue',
          title: 'Your billing amount has changed',
          message: `New amount: ₹${amount}/month`,
          source: 'billing',
          sourceId: `qa-billing-${targetUser.id}-${amount}-${dateStr}`,
          actionUrl: '/app/settings',
          actionLabel: 'View Billing',
          metadata: { amount, ...metadata },
        })
        if (notif) notificationIds.push(notif.id)
        else errors.push('Failed to create billing_amount_changed notification')
      }

      if (scenario === 'renewal_due_soon') {
        const daysUntil = metadata?.daysUntil || 7
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'subscription_reminder',
          title: 'Subscription renewal coming up',
          message: `Your subscription renews in ${daysUntil} days.`,
          source: 'subscription',
          sourceId: `qa-renewal-soon-${targetUser.id}-${daysUntil}-${dateStr}`,
          actionUrl: '/app/subscriptions',
          actionLabel: 'View Subscriptions',
          metadata: { daysUntil, ...metadata },
        })
        if (notif) notificationIds.push(notif.id)
        else errors.push('Failed to create renewal_due_soon notification')
      }

      if (scenario === 'renewal_due_today') {
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'subscription_reminder',
          title: 'Subscription renewing today',
          message: 'Your subscription will renew today.',
          source: 'subscription',
          sourceId: `qa-renewal-today-${targetUser.id}-${dateStr}`,
          actionUrl: '/app/subscriptions',
          actionLabel: 'View Subscriptions',
          metadata: { ...metadata },
        })
        if (notif) notificationIds.push(notif.id)
        else errors.push('Failed to create renewal_due_today notification')
      }

      if (scenario === 'system_test') {
        const timestamp = now.getTime()
        const notif = await createNotification({
          userId: targetUser.id,
          type: 'family_invite',
          title: 'QA Test Notification',
          message: 'This is a test notification from the QA trigger API.',
          source: 'system',
          sourceId: `qa-test-${targetUser.id}-${timestamp}`,
          actionUrl: '/app/notifications',
          actionLabel: 'View Notifications',
          metadata: { qaTest: true, ...metadata },
        })
        if (notif) notificationIds.push(notif.id)
        else errors.push('Failed to create system_test notification')
      }
    } catch (error) {
      errors.push(
        `Failed to create notification: ${error instanceof Error ? error.message : 'unknown error'}`
      )
    }

    const success = notificationIds.length > 0 && errors.length === 0
    return NextResponse.json(
      {
        success,
        scenario,
        notificationIds,
        targetUserId: targetUser.id,
        ownerUserId: ownerUser?.id,
        errors: success ? [] : errors,
      } as QANotificationResponse,
      { status: success ? 200 : 400 }
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
