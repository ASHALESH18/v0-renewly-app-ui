import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials')
  }

  // Create a server-side client with cookie-based auth
  const client = createSupabaseClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        cookie: cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ')
      }
    }
  })

  return client
}
