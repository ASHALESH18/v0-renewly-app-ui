-- Add welcome_email_sent_at column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

-- Backfill existing users to avoid accidentally sending welcome emails
UPDATE public.profiles
SET welcome_email_sent_at = NOW()
WHERE welcome_email_sent_at IS NULL;
