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
    isSystemManaged: row.is_system_managed,
    managedPlan: row.managed_plan as 'pro' | 'family' | undefined,
    systemSource: row.system_source as 'renewly_billing' | undefined,
    managedSubscriptionKey: row.managed_subscription_key,
    billingOwnerUserId: row.billing_owner_user_id,
    familyGroupId: row.family_group_id,
    coveredByFamily: row.covered_by_family,
    systemMetadata: row.system_metadata,
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
    // System-managed fields are never set by client
    is_system_managed: false,
    managed_plan: null,
    system_source: null,
    managed_subscription_key: null,
    billing_owner_user_id: null,
    family_group_id: null,
    covered_by_family: false,
    system_metadata: {},
  }
}

export function mapUserSettingsRowToUI(row: UserSettingsRow) {
  return {
    currencyCode: row.currency_code,
    theme: row.theme as 'light' | 'dark' | 'glass',
    language: row.language,
    reminderDays: row.reminder_days,
    pushNotifications: row.push_notifications,
    pushPromptSeenAt: row.push_prompt_seen_at,
    emailNotifications: row.email_notifications,
    leakAlerts: row.leak_alerts,
    biometricEnabled: row.biometric_enabled,
    countryCode: row.country_code || undefined,
    locale: row.locale || undefined,
    timeZone: row.time_zone || undefined,
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
    push_prompt_seen_at: settings.pushPromptSeenAt || null,
    country_code: settings.countryCode || null,
    locale: settings.locale || null,
    time_zone: settings.timeZone || null,
  }
}

