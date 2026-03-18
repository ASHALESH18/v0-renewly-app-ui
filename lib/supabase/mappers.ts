// Mappers between Supabase rows and UI domain types
import type { Subscription, SubscriptionStatus, BillingCycle, SubscriptionCategory } from '@/lib/types'
import type { SubscriptionRow, UserSettingsRow } from './database.types'

export function mapSubscriptionRowToUI(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    name: row.name,
    category: row.category as SubscriptionCategory,
    amount: Number(row.amount),
    currency: row.currency,
    billingCycle: row.billing_cycle as BillingCycle,
    status: row.status as SubscriptionStatus,
    renewalDate: row.renewal_date,
    description: row.description,
    logo: row.logo,
    color: row.color,
  }
}

export function mapUISubscriptionToRow(
  subscription: Omit<Subscription, 'id'>,
  userId: string
): Omit<SubscriptionRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    name: subscription.name,
    category: subscription.category,
    amount: subscription.amount,
    currency: subscription.currency,
    billing_cycle: subscription.billingCycle,
    status: subscription.status,
    renewal_date: subscription.renewalDate,
    description: subscription.description,
    logo: subscription.logo,
    color: subscription.color,
  }
}

export function mapUserSettingsRowToUI(row: UserSettingsRow) {
  return {
    currencyCode: row.currency_code,
    theme: row.theme as 'light' | 'dark',
    language: row.language,
    reminderDays: row.reminder_days,
    pushNotifications: row.push_notifications,
    emailNotifications: row.email_notifications,
    leakAlerts: row.leak_alerts,
    biometricEnabled: row.biometric_enabled,
  }
}

export function mapUISettingsToRow(
  settings: ReturnType<typeof mapUserSettingsRowToUI>,
  userId: string
): Omit<UserSettingsRow, 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    currency_code: settings.currencyCode,
    theme: settings.theme,
    language: settings.language,
    reminder_days: settings.reminderDays,
    push_notifications: settings.pushNotifications,
    email_notifications: settings.emailNotifications,
    leak_alerts: settings.leakAlerts,
    biometric_enabled: settings.biometricEnabled,
  }
}
