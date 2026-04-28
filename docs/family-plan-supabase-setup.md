# Family Plan Supabase Setup Guide

## Important: Manual Migration Required

Vercel does not automatically apply Supabase SQL migrations. You must run these migrations manually in Supabase.

## How to Apply Migrations

Choose one of these methods:

### Option 1: Supabase SQL Editor (Simple)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your Renewly project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the contents of `supabase/migrations/008_family_plan_foundation.sql`
6. Paste it into the SQL editor
7. Click **Run** (keyboard shortcut: `Cmd+Enter`)
8. Wait for "Success" message
9. Repeat steps 4-8 with `supabase/migrations/009_system_managed_renewly_subscriptions.sql`

### Option 2: Supabase CLI (Automated)

```bash
# Set your Supabase project URL and key
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Apply migrations in order
supabase db push --linked
```

### Option 3: Direct SQL Copy/Paste

1. Go to Supabase Dashboard → SQL Editor
2. Paste each migration file contents separately
3. Run each one

## Verify Migrations Applied

After running the migrations, verify they were applied successfully using these queries in the SQL Editor:

### Check Family Tables Exist

```sql
-- Verify family_groups table
SELECT COUNT(*) as family_groups_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'family_groups';

-- Verify family_members table
SELECT COUNT(*) as family_members_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'family_members';

-- Verify family_invites table
SELECT COUNT(*) as family_invites_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'family_invites';

-- Verify family_seat_addons table
SELECT COUNT(*) as family_seat_addons_count FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'family_seat_addons';
```

### Check System-Managed Subscription Columns

```sql
-- Verify all required columns exist on subscriptions table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
  AND column_name IN (
    'is_system_managed',
    'managed_plan',
    'system_source',
    'managed_subscription_key',
    'billing_owner_user_id',
    'family_group_id',
    'covered_by_family',
    'system_metadata'
  )
ORDER BY column_name;
```

### Check managed_subscription_key Index

```sql
-- Verify unique index on managed_subscription_key
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
  AND indexname = 'idx_subscriptions_managed_subscription_key';
```

### View All Family Plan Indexes

```sql
-- List all family plan indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'family_groups',
    'family_members',
    'family_invites',
    'family_seat_addons'
  )
ORDER BY tablename, indexname;
```

## Troubleshooting

### Error: "relation does not exist"

This means the family plan tables haven't been created yet. Run migration 008 first.

### Error: "column already exists"

This means migration 009 was already run. This is safe to ignore or re-run (uses `ADD COLUMN IF NOT EXISTS`).

### Error: "constraint already exists"

The constraint already exists from a previous run. This is expected behavior with idempotent migrations.

### RLS Policies Not Working

Ensure you're using a user with proper role. RLS policies:
- **family_groups**: Owner can view/update their group; active members can view
- **family_members**: Owner can view/update all members; members view their group
- **family_invites**: Owner can view/update invites; authenticated users can't insert
- **family_seat_addons**: Owner can view/update add-ons; members can't view/update

## Migration Files Reference

### 008_family_plan_foundation.sql

Creates the core family plan tables:
- `family_groups` - Family subscriptions (one owner + members)
- `family_members` - Members in a family group
- `family_invites` - Pending/accepted invitations
- `family_seat_addons` - Extra member seat subscriptions

All tables have:
- Proper indexes for query performance
- Row-Level Security (RLS) policies
- CHECK constraints for data integrity
- Automatic `updated_at` triggers
- Comprehensive comments

### 009_system_managed_renewly_subscriptions.sql

Extends `subscriptions` table with system-managed columns:
- `is_system_managed` - Flag for Renewly-created subscriptions
- `managed_plan` - Associated plan (pro/family)
- `system_source` - Source system (renewly_billing)
- `managed_subscription_key` - Unique upsert key
- `billing_owner_user_id` - User who's billed
- `family_group_id` - Associated family group
- `covered_by_family` - Member coverage flag
- `system_metadata` - Additional data

Includes:
- Indexes for efficient lookups
- Safe constraint checks (using DO blocks)
- Unique index on managed_subscription_key
- Detailed column comments

## Next Steps

1. Apply migrations to your Supabase database
2. Verify using queries above
3. Check build passes: `pnpm run build`
4. Application code is ready to use the new tables

## Support

If migrations fail or you need help, check:
1. Your Supabase credentials are correct
2. You're using the service role key (not anon)
3. Your database is running and accessible
4. No other migrations are conflicting
