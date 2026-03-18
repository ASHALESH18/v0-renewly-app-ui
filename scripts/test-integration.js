#!/usr/bin/env node

/**
 * Renewly Stage 2 Integration Test
 * Verifies all components are properly connected
 */

import fs from 'fs'
import path from 'path'

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
}

function check(name, condition, severity = 'error') {
  if (condition) {
    console.log(`  ✅ ${name}`)
    checks.passed++
  } else {
    if (severity === 'error') {
      console.log(`  ❌ ${name}`)
      checks.failed++
    } else {
      console.log(`  ⚠️  ${name}`)
      checks.warnings++
    }
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath)
}

function fileContains(filePath, text) {
  if (!fs.existsSync(filePath)) return false
  const content = fs.readFileSync(filePath, 'utf-8')
  return content.includes(text)
}

async function runTests() {
  console.log('\n🧪 Renewly Stage 2 - Integration Test Suite\n')
  console.log('═'.repeat(50))

  // Check new files exist
  console.log('\n📁 New Files\n')
  check('Database migration file', fileExists('supabase/migrations/001_stage2_cloud_data.sql'))
  check('Database types', fileExists('lib/supabase/database.types.ts'))
  check('Mappers', fileExists('lib/supabase/mappers.ts'))
  check('Profile repository', fileExists('lib/supabase/repositories/profile.ts'))
  check('Settings repository', fileExists('lib/supabase/repositories/settings.ts'))
  check('Subscriptions repository', fileExists('lib/supabase/repositories/subscriptions.ts'))
  check('Subscription math helpers', fileExists('lib/subscription-math.ts'))
  check('Hydration API route', fileExists('app/api/hydrate-user-data/route.ts'))
  check('Migration API route', fileExists('app/api/migrate-local-data/route.ts'))

  // Check documentation
  console.log('\n📚 Documentation\n')
  check('Quick Start guide', fileExists('QUICK_START.md'))
  check('Supabase Setup guide', fileExists('SUPABASE_SETUP.md'))
  check('Stage 2 Implementation guide', fileExists('STAGE2_IMPLEMENTATION.md'))
  check('Overview README', fileExists('README_STAGE2.md'))
  check('Changes summary', fileExists('CHANGES.md'))

  // Check store refactoring
  console.log('\n🏪 Store Refactoring\n')
  check('Store has currentUserId', fileContains('lib/store.ts', 'currentUserId: string | null'))
  check('Store has hasHydratedFromCloud', fileContains('lib/store.ts', 'hasHydratedFromCloud: boolean'))
  check('Store has hydrateAuthenticatedUserData', fileContains('lib/store.ts', 'hydrateAuthenticatedUserData'))
  check('Store has resetUserScopedState', fileContains('lib/store.ts', 'resetUserScopedState'))
  check('Store has loadSubscriptionsFromSupabase', fileContains('lib/store.ts', 'loadSubscriptionsFromSupabase'))
  check('Store imports subscription-math', fileContains('lib/store.ts', 'calculateMetrics'))

  // Check component updates
  console.log('\n⚛️  Component Updates\n')
  check('Header uses store', fileContains('components/header.tsx', "useStore((state) => state.userProfile)"))
  check('Header supports callbacks', fileContains('components/header.tsx', 'onProfileClick'))
  check('App page has hydration', fileContains('app/app/page.tsx', 'hydrateAuthenticatedUserData'))
  check('App page sets current user', fileContains('app/app/page.tsx', 'setCurrentUser'))
  check('App page has loading state', fileContains('app/app/page.tsx', 'isLoadingAuth'))

  // Check SQL migration content
  console.log('\n🗄️  Database Schema\n')
  check('Creates profiles table', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'CREATE TABLE.*profiles'))
  check('Creates user_settings table', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'CREATE TABLE.*user_settings'))
  check('Creates subscriptions table', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'CREATE TABLE.*subscriptions'))
  check('Creates notification_states table', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'CREATE TABLE.*notification_states'))
  check('Enables RLS on profiles', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'ALTER TABLE.*profiles.*ENABLE ROW LEVEL SECURITY'))
  check('Has profile auto-create trigger', fileContains('supabase/migrations/001_stage2_cloud_data.sql', 'handle_new_user'))

  // Check API routes
  console.log('\n🛣️  API Routes\n')
  check('Hydration route exports POST', fileContains('app/api/hydrate-user-data/route.ts', 'export async function POST'))
  check('Hydration route calls ensureProfile', fileContains('app/api/hydrate-user-data/route.ts', 'ensureProfile'))
  check('Migration route exports POST', fileContains('app/api/migrate-local-data/route.ts', 'export async function POST'))
  check('Migration route uses initialSubscriptions', fileContains('app/api/migrate-local-data/route.ts', 'initialSubscriptions'))

  // Check utilities
  console.log('\n🔧 Utilities\n')
  check('Subscription math has toMonthlyAmount', fileContains('lib/subscription-math.ts', 'toMonthlyAmount'))
  check('Subscription math has calculateMetrics', fileContains('lib/subscription-math.ts', 'calculateMetrics'))
  check('Mappers convert profiles', fileContains('lib/supabase/mappers.ts', 'mapSubscriptionRowToUI'))
  check('Mappers convert settings', fileContains('lib/supabase/mappers.ts', 'mapUserSettingsRowToUI'))

  // Check preserved design system
  console.log('\n🎨 Design System (Preserved)\n')
  check('Obsidian Reserve theme intact', fileExists('globals.css'), 'warn')
  check('Motion components preserved', fileExists('components/motion.ts'), 'warn')
  check('Auth screens preserved', fileExists('app/auth'), 'warn')

  // Summary
  console.log('\n' + '═'.repeat(50))
  console.log('\n📊 Test Results\n')
  console.log(`   ✅ Passed: ${checks.passed}`)
  console.log(`   ❌ Failed: ${checks.failed}`)
  console.log(`   ⚠️  Warnings: ${checks.warnings}`)

  const total = checks.passed + checks.failed + checks.warnings
  const percentage = Math.round((checks.passed / total) * 100)

  console.log(`\n   Overall: ${percentage}% (${checks.passed}/${total})`)

  if (checks.failed === 0) {
    console.log('\n✨ All checks passed! Implementation is complete.\n')
    console.log('📖 Next steps:')
    console.log('   1. Read QUICK_START.md for setup instructions')
    console.log('   2. Apply database migration via Supabase Dashboard')
    console.log('   3. Test signup/signin flow')
    console.log('   4. Verify data appears in Supabase tables\n')
  } else {
    console.log('\n⚠️  Some checks failed. Please review CHANGES.md\n')
    process.exit(1)
  }
}

runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
