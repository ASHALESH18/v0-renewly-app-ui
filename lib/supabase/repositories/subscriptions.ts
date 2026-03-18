// Server-side data fetching for subscriptions

import { getUser } from '../server'
import type { SubscriptionRow } from '../database.types'

export async function getUserSubscriptions(): Promise<SubscriptionRow[]> {
  try {
    const user = await getUser()
    if (!user) return []

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${user.id}&order=created_at.desc`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) return []
    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.error('[v0] Failed to fetch subscriptions:', err)
    return []
  }
}

export async function countUserSubscriptions(userId: string): Promise<number> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${userId}&select=count=count()`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        },
      }
    )

    if (!response.ok) return 0
    const data = await response.json()
    return data[0]?.count || 0
  } catch (err) {
    console.error('[v0] Failed to count subscriptions:', err)
    return 0
  }
}
