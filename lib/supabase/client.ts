'use client'

import { createClient as createClientLib } from '@supabase/supabase-js'

let supabaseClient: ReturnType<typeof createClientLib> | null = null
let isInitializing = false
let initPromise: Promise<ReturnType<typeof createClientLib>> | null = null

export function createClient() {
  // If already created, return immediately
  if (supabaseClient) {
    return supabaseClient
  }

  // If currently initializing, wait for that promise
  if (isInitializing && initPromise) {
    return initPromise as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  // Mark as initializing to prevent concurrent initialization
  isInitializing = true
  
  // Create the client
  supabaseClient = createClientLib(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  isInitializing = false
  initPromise = null

  return supabaseClient
}

