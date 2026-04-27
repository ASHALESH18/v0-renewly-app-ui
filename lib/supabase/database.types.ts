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
