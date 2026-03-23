import { createClient as _createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

let _instance: ReturnType<typeof _createClient<Database>> | null = null

export function createClient() {
  if (_instance) return _instance
  _instance = _createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  return _instance
}


