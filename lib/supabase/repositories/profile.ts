// Server-side data fetching for profiles
// Safe to use in Server Components and Route Handlers

import { getUser } from './server'
import type { ProfileRow } from './database.types'

export async function getProfile(): Promise<ProfileRow | null> {
  try {
    const user = await getUser()
    if (!user) return null

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
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
    console.error('[v0] Failed to fetch profile:', err)
    return null
  }
}

export async function ensureProfile(userId: string, email: string): Promise<ProfileRow | null> {
  try {
    // Check if profile exists
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        },
      }
    )

    if (!response.ok) throw new Error('Failed to check profile')
    const data = await response.json()

    if (data && data.length > 0) {
      return data[0]
    }

    // Create profile if missing
    const createResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userId,
          email,
          full_name: email.split('@')[0],
          plan: 'free',
        }),
      }
    )

    if (!createResponse.ok) throw new Error('Failed to create profile')
    const created = await createResponse.json()
    return created[0] || null
  } catch (err) {
    console.error('[v0] Failed to ensure profile:', err)
    return null
  }
}
