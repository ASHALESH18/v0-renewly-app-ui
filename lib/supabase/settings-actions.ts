'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Update user profile (name, avatar URL)
 */
export async function updateUserProfile(data: {
  firstName?: string
  lastName?: string
  avatarUrl?: string
}) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        avatar_url: data.avatarUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    revalidateTag('user-profile')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update profile error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Change user email address - sends verification email
 */
export async function changeUserEmail(newEmail: string) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    // Use the authenticated client to update email
    const authClient = createClient(supabaseUrl, supabaseServiceKey)
    const { error } = await authClient.auth.admin.updateUserById(user.id, {
      email: newEmail,
    })

    if (error) throw error

    return { success: true, message: 'Verification email sent to your new address' }
  } catch (error) {
    console.error('[v0] Change email error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update user preferences: currency, language, theme
 */
export async function updateUserSettings(data: {
  currencyCode?: string
  theme?: 'light' | 'dark'
  language?: string
  reminderDays?: number
  pushNotifications?: boolean
  emailNotifications?: boolean
  leakAlerts?: boolean
  biometricEnabled?: boolean
  locale?: string
  countryCode?: string
  timeZone?: string
}) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        currency_code: data.currencyCode,
        theme: data.theme,
        language: data.language,
        reminder_days: data.reminderDays,
        push_notifications: data.pushNotifications,
        email_notifications: data.emailNotifications,
        leak_alerts: data.leakAlerts,
        biometric_enabled: data.biometricEnabled,
        locale: data.locale,
        country_code: data.countryCode,
        time_zone: data.timeZone,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) throw error

    revalidateTag('user-settings')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update settings error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Update notification preferences for the user
 */
export async function updateNotificationPreferences(data: {
  emailReminders?: boolean
  emailOnRenewal?: boolean
  emailOnSpike?: boolean
  reminderDaysBefore?: number
}) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        email_reminders: data.emailReminders,
        email_on_renewal: data.emailOnRenewal,
        email_on_spending_spike: data.emailOnSpike,
        reminder_days_before: data.reminderDaysBefore,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      })

    if (error) throw error

    revalidateTag('notification-preferences')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update notification preferences error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get user settings and preferences from the database
 */
export async function getUserSettings() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const [settingsRes, notificationsRes] = await Promise.all([
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ])

    return {
      success: true,
      settings: settingsRes.data || null,
      notifications: notificationsRes.data || null,
    }
  } catch (error) {
    console.error('[v0] Get settings error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteUserAccount() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    // Delete all user data - cascade deletes will handle related records
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (deleteError) throw deleteError

    // Delete auth user account
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
    if (authError) throw authError

    return { success: true, message: 'Account deleted successfully' }
  } catch (error) {
    console.error('[v0] Delete account error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Export user data for GDPR compliance
 */
export async function exportUserData() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const [profileRes, subscriptionsRes, settingsRes, notificationsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id),
      supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single(),
    ])

    return {
      success: true,
      data: {
        profile: profileRes.data,
        subscriptions: subscriptionsRes.data || [],
        settings: settingsRes.data,
        notifications: notificationsRes.data,
      },
    }
  } catch (error) {
    console.error('[v0] Export data error:', error)
    return { success: false, error: (error as Error).message }
  }
}
