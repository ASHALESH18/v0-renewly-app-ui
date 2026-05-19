// N2: Notification type registry with categories and templates

export type NotificationCategory = 'billing' | 'family' | 'renewals' | 'security' | 'system' | 'info'
export type NotificationType = 
  | 'renewal_7day'
  | 'renewal_3day'
  | 'renewal_1day'
  | 'renewal_today'
  | 'trial_ending_3day'
  | 'trial_ending_1day'
  | 'trial_ended'
  | 'subscription_renewed'
  | 'subscription_expired'
  | 'pro_downgrade_scheduled'
  | 'family_invite'
  | 'family_member_joined'
  | 'family_member_left'
  | 'family_member_removed'
  | 'family_access_ending'
  | 'extra_seat_added'
  | 'extra_seat_removed'
  | 'billing_failed'
  | 'payment_method_expiring'
  | 'account_security_alert'
  | 'feature_released'
  | 'maintenance_scheduled'

export interface NotificationTemplate {
  type: NotificationType
  category: NotificationCategory
  title: (metadata: Record<string, any>) => string
  message: (metadata: Record<string, any>) => string
  icon: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  actionUrl?: (metadata: Record<string, any>) => string
  retentionDays: number
}

// N2: Central registry of all notification types and templates
export const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationTemplate> = {
  renewal_7day: {
    type: 'renewal_7day',
    category: 'renewals',
    title: (m) => `${m.name} renews in 7 days`,
    message: (m) => `Your subscription will renew for ₹${m.amount}/month on ${m.renewalDate}`,
    icon: 'bell',
    priority: 'normal',
    actionUrl: () => '/app/subscriptions',
    retentionDays: 30,
  },
  renewal_3day: {
    type: 'renewal_3day',
    category: 'renewals',
    title: (m) => `${m.name} renews in 3 days`,
    message: (m) => `Your subscription will renew for ₹${m.amount}/month on ${m.renewalDate}`,
    icon: 'bell',
    priority: 'normal',
    actionUrl: () => '/app/subscriptions',
    retentionDays: 30,
  },
  renewal_1day: {
    type: 'renewal_1day',
    category: 'renewals',
    title: (m) => `${m.name} renews tomorrow`,
    message: (m) => `Your subscription will renew for ₹${m.amount}/month tomorrow`,
    icon: 'bell',
    priority: 'high',
    actionUrl: () => '/app/subscriptions',
    retentionDays: 30,
  },
  renewal_today: {
    type: 'renewal_today',
    category: 'renewals',
    title: (m) => `${m.name} renewing today`,
    message: (m) => `Your subscription is renewing today for ₹${m.amount}/month`,
    icon: 'bell',
    priority: 'high',
    actionUrl: () => '/app/subscriptions',
    retentionDays: 30,
  },
  trial_ending_3day: {
    type: 'trial_ending_3day',
    category: 'renewals',
    title: () => 'Your trial ends in 3 days',
    message: () => 'Choose a plan to continue using Renewly',
    icon: 'timer',
    priority: 'normal',
    actionUrl: () => '/app/upgrade',
    retentionDays: 30,
  },
  trial_ending_1day: {
    type: 'trial_ending_1day',
    category: 'renewals',
    title: () => 'Your trial ends tomorrow',
    message: () => 'Upgrade now to keep using Renewly',
    icon: 'alert-circle',
    priority: 'high',
    actionUrl: () => '/app/upgrade',
    retentionDays: 30,
  },
  trial_ended: {
    type: 'trial_ended',
    category: 'renewals',
    title: () => 'Your trial has ended',
    message: () => 'Upgrade to continue using Renewly',
    icon: 'alert-circle',
    priority: 'critical',
    actionUrl: () => '/app/upgrade',
    retentionDays: 365,
  },
  subscription_renewed: {
    type: 'subscription_renewed',
    category: 'billing',
    title: (m) => `${m.name} renewed successfully`,
    message: (m) => `Charged ₹${m.amount} for your subscription renewal`,
    icon: 'check-circle',
    priority: 'normal',
    actionUrl: () => '/app/subscriptions',
    retentionDays: 365,
  },
  subscription_expired: {
    type: 'subscription_expired',
    category: 'billing',
    title: (m) => `${m.name} has expired`,
    message: () => 'Upgrade to restore access',
    icon: 'alert-circle',
    priority: 'critical',
    actionUrl: () => '/app/upgrade',
    retentionDays: 365,
  },
  pro_downgrade_scheduled: {
    type: 'pro_downgrade_scheduled',
    category: 'billing',
    title: () => 'Pro plan downgrade scheduled',
    message: (m) => `Your plan will downgrade to Free on ${m.downgradeDate}`,
    icon: 'arrow-down',
    priority: 'normal',
    actionUrl: () => '/app/settings',
    retentionDays: 365,
  },
  family_invite: {
    type: 'family_invite',
    category: 'family',
    title: (m) => `${m.ownerName} invited you to their Family`,
    message: () => 'Join to get included in their subscription',
    icon: 'users',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 30,
  },
  family_member_joined: {
    type: 'family_member_joined',
    category: 'family',
    title: (m) => `${m.memberName} joined your Family`,
    message: () => 'You now have 1 more member',
    icon: 'user-plus',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 365,
  },
  family_member_left: {
    type: 'family_member_left',
    category: 'family',
    title: (m) => `${m.memberName} left your Family`,
    message: () => 'They no longer have access to your subscription',
    icon: 'user-minus',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 365,
  },
  family_member_removed: {
    type: 'family_member_removed',
    category: 'family',
    title: (m) => `${m.ownerName} removed you from their Family`,
    message: () => 'You no longer have access to their subscription',
    icon: 'user-x',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 365,
  },
  family_access_ending: {
    type: 'family_access_ending',
    category: 'family',
    title: () => 'Your Family access is ending soon',
    message: (m) => `Your access ends on ${m.accessEndsAt}`,
    icon: 'alert-circle',
    priority: 'high',
    actionUrl: () => '/app/upgrade',
    retentionDays: 365,
  },
  extra_seat_added: {
    type: 'extra_seat_added',
    category: 'billing',
    title: () => 'Extra seat added to your Family',
    message: (m) => `Now ₹${m.amount}/month for the extra seat`,
    icon: 'plus-circle',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 365,
  },
  extra_seat_removed: {
    type: 'extra_seat_removed',
    category: 'billing',
    title: () => 'Extra seat removed from your Family',
    message: (m) => `This will take effect on ${m.effectiveDate}`,
    icon: 'minus-circle',
    priority: 'normal',
    actionUrl: () => '/app/family',
    retentionDays: 365,
  },
  billing_failed: {
    type: 'billing_failed',
    category: 'billing',
    title: () => 'Payment failed',
    message: () => 'We couldn\'t process your payment. Update your payment method.',
    icon: 'alert-circle',
    priority: 'critical',
    actionUrl: () => '/app/settings',
    retentionDays: 365,
  },
  payment_method_expiring: {
    type: 'payment_method_expiring',
    category: 'billing',
    title: () => 'Payment method expiring soon',
    message: (m) => `Your card expires on ${m.expiryDate}`,
    icon: 'credit-card',
    priority: 'normal',
    actionUrl: () => '/app/settings',
    retentionDays: 30,
  },
  account_security_alert: {
    type: 'account_security_alert',
    category: 'security',
    title: () => 'Unusual account activity detected',
    message: () => 'Review your account security settings',
    icon: 'shield-alert',
    priority: 'critical',
    actionUrl: () => '/app/settings',
    retentionDays: 365,
  },
  feature_released: {
    type: 'feature_released',
    category: 'system',
    title: (m) => `New: ${m.featureName}`,
    message: (m) => m.description,
    icon: 'sparkles',
    priority: 'low',
    actionUrl: () => '/app',
    retentionDays: 30,
  },
  maintenance_scheduled: {
    type: 'maintenance_scheduled',
    category: 'system',
    title: () => 'Scheduled maintenance',
    message: (m) => `Maintenance window: ${m.startTime} to ${m.endTime}`,
    icon: 'wrench',
    priority: 'normal',
    actionUrl: undefined,
    retentionDays: 30,
  },
}

// Helper to get category label
export function getCategoryLabel(category: NotificationCategory): string {
  const labels: Record<NotificationCategory, string> = {
    billing: 'Billing',
    family: 'Family',
    renewals: 'Renewals',
    security: 'Security',
    system: 'System',
    info: 'Info',
  }
  return labels[category]
}

// Helper to get icon component name
export function getNotificationIcon(template: NotificationTemplate): string {
  return template.icon
}
