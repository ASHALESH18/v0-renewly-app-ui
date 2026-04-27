// Database types that map to Supabase tables
export interface ProfileRow {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  avatar_seed: string | null
  plan: 'free' | 'pro' | 'family' | 'enterprise'
  country_code: string | null
  locale: string | null
  time_zone: string | null
  welcome_email_sent_at: string | null
  created_at: string
  updated_at: string
  avatar_source: 'provider' | 'user' | 'generated' | null
}

export interface UserSettingsRow {
  user_id: string
  currency_code: string
  theme: 'light' | 'dark' | 'glass'
  language: string
  country_code: string | null
  locale: string | null
  time_zone: string | null
  reminder_days: number
  push_notifications: boolean
  email_notifications: boolean
  leak_alerts: boolean
  biometric_enabled: boolean
  push_prompt_seen_at: string | null
  created_at: string
  updated_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  currency: string
  billing_cycle: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  status: 'active' | 'paused' | 'unused' | 'cancelled'
  renewal_date: string | null
  description: string | null
  logo: string | null
  color: string | null
  is_system_managed: boolean
  managed_plan: 'pro' | 'family' | null
  system_source: 'renewly_billing' | null
  managed_subscription_key: string | null
  billing_owner_user_id: string | null
  family_group_id: string | null
  covered_by_family: boolean
  system_metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface NotificationDeliveryRow {
  id: string
  user_id: string
  subscription_id: string | null
  channel: 'email' | 'push' | 'in_app'
  notification_type: string
  reminder_date: string | null
  summary_week_start: string | null
  unique_key: string
  sent_at: string
  created_at: string
}

export interface NotificationStateRow {
  id: string
  user_id: string
  notification_key: string
  is_read: boolean
  dismissed: boolean
  created_at: string
  updated_at: string
}

// Family Plan Tables

export interface FamilyGroupRow {
  id: string
  owner_user_id: string
  status: 'active' | 'past_due' | 'cancelled'
  included_member_limit: number
  extra_member_price_inr: number
  extra_seat_count: number
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
  updated_at: string
}

export interface FamilyMemberRow {
  id: string
  family_group_id: string
  user_id: string
  email: string
  role: 'owner' | 'member'
  status: 'active' | 'removed'
  seat_type: 'owner' | 'included' | 'extra'
  joined_at: string
  removed_at: string | null
  removed_by: string | null
  created_at: string
  updated_at: string
}

export interface FamilyInviteRow {
  id: string
  family_group_id: string
  invited_email: string
  invited_by: string
  token_hash: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  seat_type: 'included' | 'extra'
  expires_at: string
  accepted_by: string | null
  accepted_at: string | null
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

export interface FamilySeatAddonRow {
  id: string
  family_group_id: string
  quantity: number
  price_inr_per_seat: number
  status: 'active' | 'cancelled' | 'past_due'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}
