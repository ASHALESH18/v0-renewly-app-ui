import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('[migration] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

async function runMigration() {
  console.log('[migration] Starting database setup...')
  
  try {
    // Create profiles table
    console.log('[migration] Creating profiles table...')
    const { error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    if (profilesError?.code === 'PGRST116') {
      // Table doesn't exist, this is expected on first run
      console.log('[migration] Profiles table needs to be created - please use Supabase dashboard or SQL editor')
    } else if (profilesError && profilesError.code !== 'PGRST116') {
      throw profilesError
    } else {
      console.log('[migration] Profiles table already exists')
    }
    
    console.log('[migration] Setup validation complete!')
    console.log('[migration] Note: Use the Supabase dashboard to run the SQL migration file manually')
    
  } catch (error) {
    console.error('[migration] Error:', error.message)
    process.exit(1)
  }
}

runMigration()
