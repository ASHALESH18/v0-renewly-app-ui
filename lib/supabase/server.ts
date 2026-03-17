import { cookies } from 'next/headers'
import { createClient as createClientLib } from '@supabase/supabase-js'

export async function createClient() {
  const cookieStore = await cookies()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const client = createClientLib(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  // Restore session from cookies if available
  const authCookie = cookieStore.get('sb-auth-token')
  if (authCookie?.value) {
    try {
      const session = JSON.parse(authCookie.value)
      await client.auth.setSession(session)
    } catch (err) {
      // Invalid session cookie, continue without session
    }
  }

  return client
}

export async function getSession() {
  const client = await createClient()
  const { data: { session }, error } = await client.auth.getSession()
  return session
}

export async function getUser() {
  const client = await createClient()
  const { data: { user }, error } = await client.auth.getUser()
  return user
}
