'use server'

import { revalidateTag } from 'next/cache'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Get Supabase client for profile operations
 * Initializes inside function calls, not at module level, to avoid build-time errors
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase env vars')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function updateProfile(data: {
  fullName?: string
  email?: string
  avatarUrl?: string
}) {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')
    
    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.fullName,
        email: data.email,
        avatar_url: data.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    revalidateTag('profile')
    return { success: true }
  } catch (error) {
    console.error('[v0] Update profile error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getProfile() {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('[v0] Get profile error:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function upgradePlan(planId: 'pro' | 'family' | 'enterprise') {
  try {
    const user = await getUser()
    if (!user) throw new Error('Unauthorized')

    const { error } = await supabase
      .from('profiles')
      .update({
        plan: planId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) throw error

    revalidateTag('profile')
    return { success: true }
  } catch (error) {
    console.error('[v0] Upgrade plan error:', error)
    return { success: false, error: (error as Error).message }
  }
}
