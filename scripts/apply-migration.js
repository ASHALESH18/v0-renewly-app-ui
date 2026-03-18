#!/usr/bin/env node

/**
 * Apply Renewly Stage 2 database migration
 * Reads the SQL migration and executes it against your Supabase instance
 */

import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function applyMigration() {
  try {
    console.log('📊 Applying Renewly Stage 2 database migration...\n')

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '001_stage2_cloud_data.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')

    console.log(`📁 Migration file: ${migrationPath}`)
    console.log(`🔐 Supabase URL: ${supabaseUrl}\n`)

    // Execute the SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`API Error: ${error.message || response.statusText}`)
    }

    console.log('✅ Migration applied successfully!\n')

    // Verify tables were created
    console.log('📋 Verifying tables...\n')
    const verifyResponse = await fetch(`${supabaseUrl}/rest/v1/information_schema.tables?table_schema=eq.public`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
    })

    if (verifyResponse.ok) {
      const tables = await verifyResponse.json()
      const tableNames = tables
        .map((t: any) => t.table_name)
        .filter((name: string) => ['profiles', 'user_settings', 'subscriptions', 'notification_states'].includes(name))

      if (tableNames.length === 4) {
        console.log('✅ All 4 tables created successfully:')
        console.log('   ✓ profiles')
        console.log('   ✓ user_settings')
        console.log('   ✓ subscriptions')
        console.log('   ✓ notification_states')
      } else {
        console.warn(`⚠️  Only ${tableNames.length}/4 tables verified`)
        console.log('   Created:', tableNames.join(', '))
      }
    }

    console.log('\n🎉 Database migration complete!')
    console.log('\n📖 Next steps:')
    console.log('   1. Verify tables in Supabase Dashboard → Table Editor')
    console.log('   2. Sign up a new user to test auto-profile creation')
    console.log('   3. Check QUICK_START.md for testing instructions')

  } catch (error) {
    console.error('❌ Migration failed:', error instanceof Error ? error.message : error)
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Verify environment variables are set correctly')
    console.error('   2. Try applying migration manually via Supabase Dashboard')
    console.error('   3. See SUPABASE_SETUP.md for detailed instructions')
    process.exit(1)
  }
}

applyMigration()
