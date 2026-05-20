// Combo 5: Billing notification event helpers
// Called after successful billing operations to create persistent notifications

import { createNotification } from './notification-service'
import { formatCurrencyAmount } from '@/lib/currency'

export async function notifySubscriptionRenewal(
  userId: string,
  subscriptionName: string,
  amountInr: number,
  subscriptionId: string
) {
  await createNotification({
    userId,
    type: 'subscription_renewed',
    title: `${subscriptionName} renewed successfully`,
    message: `Charged ${formatCurrencyAmount(amountInr, 'INR')} for your subscription renewal`,
    category: 'billing',
    severity: 'info',
    actionUrl: '/app/subscriptions',
    entityType: 'subscription',
    entityId: subscriptionId,
    idempotencyKey: `subscription_renewed:${subscriptionId}:${new Date().toDateString()}`,
    metadata: {
      subscriptionName,
      amountInr,
      renewedAt: new Date().toISOString(),
    },
  })
}

export async function notifyBillingFailed(
  userId: string,
  reason: string
) {
  await createNotification({
    userId,
    type: 'billing_failed',
    title: 'Payment failed',
    message: `We couldn't process your payment. ${reason}. Update your payment method.`,
    category: 'billing',
    severity: 'critical',
    actionUrl: '/app/settings',
    idempotencyKey: `billing_failed:${userId}:${Date.now()}`,
    metadata: {
      reason,
    },
  })
}

export async function notifyPaymentMethodExpiring(
  userId: string,
  cardLast4: string,
  expiryDate: string
) {
  await createNotification({
    userId,
    type: 'payment_method_expiring',
    title: 'Payment method expiring soon',
    message: `Your card ending in ${cardLast4} expires on ${expiryDate}`,
    category: 'billing',
    severity: 'warning',
    actionUrl: '/app/settings',
    idempotencyKey: `payment_method_expiring:${userId}:${cardLast4}`,
    metadata: {
      cardLast4,
      expiryDate,
    },
  })
}

export async function notifyPlanUpgraded(
  userId: string,
  previousPlan: string,
  newPlan: string,
  amountInr: number
) {
  await createNotification({
    userId,
    type: 'plan_upgraded',
    title: `Upgraded from ${previousPlan} to ${newPlan}`,
    message: `New billing amount: ${formatCurrencyAmount(amountInr, 'INR')}/month`,
    category: 'billing',
    severity: 'info',
    actionUrl: '/app/settings',
    idempotencyKey: `plan_upgraded:${userId}:${newPlan}`,
    metadata: {
      previousPlan,
      newPlan,
      amountInr,
    },
  })
}

export async function notifyPlanDowngraded(
  userId: string,
  previousPlan: string,
  newPlan: string,
  effectiveDate: string
) {
  await createNotification({
    userId,
    type: 'pro_downgrade_scheduled',
    title: `Downgrade to ${newPlan} scheduled`,
    message: `Your plan will downgrade from ${previousPlan} on ${effectiveDate}`,
    category: 'billing',
    severity: 'warning',
    actionUrl: '/app/settings',
    idempotencyKey: `plan_downgraded:${userId}:${effectiveDate}`,
    metadata: {
      previousPlan,
      newPlan,
      effectiveDate,
    },
  })
}

export async function notifyPlanCancellationScheduled(
  userId: string,
  planName: string,
  effectiveDate: string
) {
  await createNotification({
    userId,
    type: 'pro_downgrade_scheduled',
    title: `${planName} cancellation scheduled`,
    message: `Your plan will be cancelled on ${effectiveDate}. Undo cancellation in Settings.`,
    category: 'billing',
    severity: 'critical',
    actionUrl: '/app/settings',
    idempotencyKey: `plan_cancellation_scheduled:${userId}:${effectiveDate}`,
    metadata: {
      planName,
      effectiveDate,
    },
  })
}

export async function notifyPlanCancellationReversed(
  userId: string,
  planName: string
) {
  await createNotification({
    userId,
    type: 'plan_upgraded',
    title: `${planName} cancellation reversed`,
    message: 'Your plan will continue at the next renewal.',
    category: 'billing',
    severity: 'info',
    actionUrl: '/app/settings',
    idempotencyKey: `plan_cancellation_reversed:${userId}`,
    metadata: {
      planName,
    },
  })
}
