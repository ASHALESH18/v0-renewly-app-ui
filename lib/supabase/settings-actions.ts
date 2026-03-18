'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

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
      .update({
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
      })
      .eq('user_id', user.id)

    if (error) throw error

    revalidateTag('user-settings')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update settings error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getUserSettings() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('[v0] Get settings error:', error)
    return { success: false, error: (error as Error).message }
  }
}
