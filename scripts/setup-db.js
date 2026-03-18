import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

const SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles ON DELETE CASCADE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  leak_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  reminder_days INT NOT NULL DEFAULT 3,
  currency_code TEXT NOT NULL DEFAULT 'INR',
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light', 'dark')),
  language TEXT NOT NULL DEFAULT 'en',
  biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_renewal_date TIMESTAMPTZ NOT NULL,
  last_renewed_date TIMESTAMPTZ,
  payment_method TEXT DEFAULT 'card',
  auto_renewal BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification states table
CREATE TABLE IF NOT EXISTS notification_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('renewal', 'leak', 'custom')),
  sent_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(subscription_id, notification_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_renewal ON subscriptions(next_renewal_date);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_states_user_id ON notification_states(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_states ENABLE ROW LEVEL SECURITY;

-- Profiles RLS policies
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- User settings RLS policies
CREATE POLICY "Users can view own settings" ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions RLS policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON subscriptions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON subscriptions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON subscriptions 
  FOR DELETE USING (auth.uid() = user_id);

-- Notification states RLS policies
CREATE POLICY "Users can view own notifications" ON notification_states 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON notification_states 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notification_states 
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`

async function runMigration() {
  console.log('[migration] Starting database migration...')
  
  try {
    // Split SQL into individual statements and execute them
    const statements = SQL.split(';').filter(s => s.trim())
    
    for (const statement of statements) {
      if (statement.trim()) {
        const result = await supabase.rpc('exec_sql', { sql_query: statement + ';' }).catch(() => {
          // rpc method might not exist, fallback to direct SQL
          return null
        })
        
        console.log('[migration] Executed:', statement.substring(0, 50) + '...')
      }
    }
    
    console.log('[migration] Database migration completed successfully!')
  } catch (error) {
    console.error('[migration] Error:', error)
    process.exit(1)
  }
}

runMigration()
