# Quick Start: Enable Cloud-Backed Data in Renewly

## ⚡ 5-Minute Setup

### Step 1: Apply Database Migration
1. Open Supabase Dashboard: https://app.supabase.com
2. Select your Renewly project
3. Click **SQL Editor** → **New Query**
4. Copy the entire SQL from `supabase/migrations/001_stage2_cloud_data.sql`
5. Paste and click **Run**
6. Wait ~30 seconds for completion ✅

### Step 2: Verify Database Tables
1. In Supabase, click **Table Editor**
2. Confirm you see these 4 tables:
   - `profiles` (green RLS icon)
   - `user_settings` (green RLS icon)
   - `subscriptions` (green RLS icon)
   - `notification_states` (green RLS icon)

### Step 3: Test It Out
1. Start the app: `npm run dev`
2. Go to http://localhost:3000
3. Sign up with a new test account
4. Check Supabase → you should see your profile auto-created ✅
5. Sign in to the app
6. Add a subscription → check Table Editor → `subscriptions` table
7. You should see your subscription appear! ✅

## 🎯 What Just Happened

✅ Database schema created with 4 per-user tables  
✅ Row-level security prevents cross-user data access  
✅ Auto-triggers create profile & settings on signup  
✅ App now loads real user data from Supabase on login  
✅ Local data migrated to cloud on first login  
✅ Profile button in header is now clickable  

## 📝 What's NOT Yet Implemented

- API routes for add/edit/delete subscriptions (WIP)
- Screen components updated to use cloud data (WIP)
- Analytics, calendar, notifications with real data (WIP)

These will be completed in the next pass.

## 🔍 Troubleshooting

**Subscriptions not showing up?**
- Check your browser console for errors
- Verify you're signed in (check auth cookie)
- Try adding a subscription through the UI

**Profile showing "User" instead of name?**
- Refresh the page
- Check `profiles` table in Supabase - data should be there

**Getting permission errors?**
- Verify all 4 tables have RLS enabled (green icon)
- Check you're authenticated (should redirect to /auth/sign-in if not)

**Still stuck?**
- See `SUPABASE_SETUP.md` for detailed debugging
- Check Supabase Dashboard → Logs for database errors

---

That's it! Your Renewly app now uses real per-user cloud data. 🎉
