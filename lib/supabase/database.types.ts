// Database types that map to Supabase tables
export interface ProfileRow {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  plan: 'free' | 'premium'
  created_at: string
  updated_at: string
}

export interface UserSettingsRow {
  user_id: string
  currency_code: string
  theme: 'light' | 'dark'
  language: string
  reminder_days: number
  push_notifications: boolean
  email_notifications: boolean
  leak_alerts: boolean
  biometric_enabled: boolean
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

export interface NotificationStateRow {
  id: string
  user_id: string
  notification_key: string
  is_read: boolean
  dismissed: boolean
  created_at: string
  updated_at: string
}
