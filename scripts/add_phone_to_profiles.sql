-- Add phone number columns to profiles table
-- This migration adds phone and phone_verified columns for the Phone Number settings feature

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'User phone number (unverified - SMS not configured)';
COMMENT ON COLUMN public.profiles.phone_verified IS 'Phone verification status - always false until SMS is configured';
