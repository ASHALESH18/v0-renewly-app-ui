import { cookies } from 'next/headers'

export async function createClient() {
  try {
    // Lazy require to avoid build-time dependency issues
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    const cookieStore = await cookies()
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
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
  } catch (error) {
    console.error('[v0] Supabase server client initialization failed:', error)
    return createMockClient()
  }
}

function createMockClient() {
  return {
    auth: {
      signUp: async () => ({ error: new Error('Supabase not configured') }),
      signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({ error: new Error('Supabase not configured') }),
      resetPasswordForEmail: async () => ({ error: new Error('Supabase not configured') }),
      updateUser: async () => ({ error: new Error('Supabase not configured') }),
      getUser: async () => ({ data: { user: null }, error: null }),
    }
  }
}

