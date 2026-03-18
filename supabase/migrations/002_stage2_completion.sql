-- Stage 2 Completion: Plan Model Normalization & User Localization
-- Migration: normalize 'premium' to 'pro' and add locale/country fields
-- Safe additive migration - no data loss

-- 1. Alter profiles table to add new fields
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_seed text,
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS time_zone text;

-- 2. Update the plan enum constraint
-- Drop existing constraint if it exists
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 3. Add new constraint with all plan types
ALTER TABLE profiles
  ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free', 'pro', 'family', 'enterprise'));

-- 4. Migrate any existing 'premium' values to 'pro'
UPDATE profiles SET plan = 'pro' WHERE plan = 'premium';

-- 5. Alter user_settings table to add locale fields
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS locale text,
  ADD COLUMN IF NOT EXISTS time_zone text;

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_user_settings_locale ON user_settings(locale);

-- 7. Add table-level comment for documentation
COMMENT ON COLUMN profiles.plan IS 'User subscription plan: free, pro, family, or enterprise';
COMMENT ON COLUMN profiles.avatar_seed IS 'Seed value for deterministic avatar generation';
COMMENT ON COLUMN profiles.country_code IS 'ISO 3166-1 country code for user location';
COMMENT ON COLUMN profiles.locale IS 'BCP 47 language tag for user locale preferences';
COMMENT ON COLUMN profiles.time_zone IS 'IANA time zone identifier';
