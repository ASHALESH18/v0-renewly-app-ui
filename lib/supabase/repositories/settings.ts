// Server-side data fetching for user settings

import { getUser } from '../server'
import type { UserSettingsRow } from '../database.types'

export async function getUserSettings(): Promise<UserSettingsRow | null> {
  try {
    const user = await getUser()
    if (!user) return null

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${user.id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) return null
    const data = await response.json()
    return data[0] || null
  } catch (err) {
    console.error('[v0] Failed to fetch user settings:', err)
    return null
  }
}

export async function ensureUserSettings(userId: string): Promise<UserSettingsRow | null> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_settings?user_id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        },
      }
    )

    if (!response.ok) throw new Error('Failed to check settings')
    const data = await response.json()

    if (data && data.length > 0) {
      return data[0]
    }

    // Create settings if missing
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/user_settings`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          currency_code: 'INR',
          theme: 'dark',
          language: 'en',
          reminder_days: 3,
          push_notifications: true,
          email_notifications: true,
          leak_alerts: true,
          biometric_enabled: false,
        }),
      }
    )

    if (!createResponse.ok) throw new Error('Failed to create settings')
    const created = await createResponse.json()
    return created[0] || null
  } catch (err) {
    console.error('[v0] Failed to ensure user settings:', err)
    return null
  }
}
