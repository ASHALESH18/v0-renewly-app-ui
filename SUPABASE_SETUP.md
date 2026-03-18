# Renewly Stage 2 - Cloud-Backed Authentication Setup Guide

## Overview
This guide helps you set up the Supabase database schema for per-user authenticated data in Renewly.

## Prerequisites
- Supabase project already created
- Supabase dashboard access
- All environment variables configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)

## Setup Instructions

### Option 1: Using Supabase Dashboard SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Select your Renewly project
   - Click "SQL Editor" in the left sidebar

2. **Create New Query**
   - Click "New Query"
   - Copy the entire contents of `supabase/migrations/001_stage2_cloud_data.sql`
   - Paste into the SQL editor

3. **Execute Migration**
   - Review the SQL
   - Click "Run" button
   - Wait for completion (should take < 30 seconds)

4. **Verify Tables Created**
   - Go to "Table Editor" in the sidebar
   - You should see:
     - `public.profiles`
     - `public.user_settings`
     - `public.subscriptions`
     - `public.notification_states`
   - Each should have a green checkmark indicating RLS is enabled

### Option 2: Using CLI (if you have Supabase CLI installed)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Apply the migration
supabase migration up

# Or manually apply SQL
supabase db push supabase/migrations/001_stage2_cloud_data.sql
```

## What Gets Created

### 1. profiles Table
Stores user identity information linked to `auth.users`
- Auto-creates profile when new user signs up
- Stores full_name, email, avatar_url, and subscription plan

### 2. user_settings Table
Stores per-user preferences
- Notifications (push, email, leak alerts)
- Appearance (theme, language)
- Behavior (reminder days, biometric)
- Auto-creates default settings when new user signs up

### 3. subscriptions Table
Stores per-user subscriptions
- Name, category, amount, currency
- Billing cycle (daily/weekly/monthly/quarterly/yearly)
- Status (active/paused/unused/cancelled)
- Renewal date and description

### 4. notification_states Table
Stores per-user notification read/dismissed state
- Tracks which notifications user has read
- Tracks which notifications user has dismissed
- Uses composite key (user_id, notification_key) for uniqueness

## Row-Level Security (RLS) Policies

All tables have RLS enabled with the following rules:

**Users can only:**
- SELECT their own rows
- INSERT their own rows
- UPDATE their own rows
- DELETE their own rows (subscriptions and notifications only)

Cross-user data access is prevented at the database level.

## Helper Functions

### update_updated_at_column()
Automatically updates the `updated_at` timestamp whenever a row is modified.

### handle_new_user() & handle_new_user_settings()
Automatically create profile and settings rows when:
1. New user signs up through auth
2. Triggered by `auth.users` INSERT event
3. No manual action required

## Verification Checklist

After running the migration, verify:

- [ ] All 4 tables exist in Table Editor
- [ ] Each table shows "RLS enabled" status
- [ ] Indexes created on:
  - [ ] subscriptions(user_id)
  - [ ] subscriptions(renewal_date)
  - [ ] notification_states(user_id)
- [ ] Triggers created:
  - [ ] update_profiles_updated_at
  - [ ] on_auth_user_created
  - [ ] on_auth_user_created_settings
  - [ ] update_user_settings_updated_at
  - [ ] update_subscriptions_updated_at
  - [ ] update_notification_states_updated_at

## Testing the Setup

1. **Sign up a new user** through Renewly auth
   - Go to http://localhost:3000/auth/sign-up
   - Create a test account

2. **Check profiles table**
   - Go to Supabase Dashboard > Table Editor > profiles
   - You should see your test user's profile auto-created

3. **Check user_settings table**
   - Go to Supabase Dashboard > Table Editor > user_settings
   - You should see your test user's settings with default values

4. **Create a test subscription**
   - Sign in to your test account
   - Add a subscription through the app
   - Go to Supabase Dashboard > Table Editor > subscriptions
   - You should see your subscription in the table

## Troubleshooting

### Tables Not Showing After Migration

**Problem**: Tables don't appear in Table Editor  
**Solution**: 
- Refresh the page
- Try running the migration again
- Check SQL execution logs in Supabase Dashboard

### "Permission denied" Errors

**Problem**: Users get permission denied when accessing their data  
**Solution**:
- Verify RLS is enabled on all tables (green checkmark in Table Editor)
- Check RLS policies use `auth.uid()` correctly
- Ensure SUPABASE_SERVICE_ROLE_KEY is set for server-side operations

### Subscriptions Not Saving

**Problem**: Adding subscriptions doesn't work  
**Solution**:
- Verify user is authenticated (check /api/hydrate-user-data)
- Check subscriptions table RLS policies
- Look for errors in browser console (Network tab)

## Next Steps

1. **User Data Hydration**: The app automatically hydrates user data on login via `/api/hydrate-user-data`
2. **Local Data Migration**: On first login, local subscriptions are migrated to Supabase via `/api/migrate-local-data`
3. **Cloud-Backed Store**: All user data is now managed by Zustand store, backed by Supabase

## Security Reminders

🔒 **Important**:
- Never expose SUPABASE_SERVICE_ROLE_KEY in client code (it's only for server)
- All client operations go through SUPABASE_ANON_KEY
- RLS policies prevent any cross-user data access
- Service role key is only used in `/api/hydrate-user-data` and `/api/migrate-local-data`

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard > Logs
2. Verify all environment variables are set correctly
3. Test individual API endpoints with curl or Postman
4. Check browser console for client-side errors

---

**Last Updated**: March 2026  
**Renewly Stage**: 2 - Cloud-Backed Authentication
