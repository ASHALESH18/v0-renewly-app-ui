// Client-side Supabase integration
// Lazy-loaded to allow builds to complete before dependencies install

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient() should only be called on the browser')
  }

  try {
    // Lazy require to avoid build-time dependency issues
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return createSupabaseClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error('[v0] Supabase client initialization failed:', error)
    // Return mock client for graceful degradation
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
      onAuthStateChange: () => ({ data: { subscription: null } }),
    }
  }
}

