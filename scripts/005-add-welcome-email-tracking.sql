-- Add welcome_email_sent_at column to profiles table for tracking welcome email delivery
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamp with time zone;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_welcome_email_sent_at ON profiles(id, welcome_email_sent_at);
