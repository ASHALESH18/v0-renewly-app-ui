import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export function getServerClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getUser() {
  const supabase = getServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getSession() {
  const supabase = getServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

// Alias for backwards compatibility
export const createClient = getServerClient

