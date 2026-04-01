-- Create OTP codes table for phone verification
-- This table stores verification codes with expiration and attempt tracking

CREATE TABLE IF NOT EXISTS otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'phone_verification',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one active code per user/purpose at a time
  CONSTRAINT unique_active_otp UNIQUE (user_id, purpose, phone)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_purpose ON otp_codes(user_id, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own OTP codes (for verification status)
CREATE POLICY "Users can view own otp codes" ON otp_codes
  FOR SELECT USING (auth.uid() = user_id);

-- Only server can insert/update OTP codes (via service role)
-- No INSERT/UPDATE policies for authenticated users - managed server-side

-- Auto-cleanup old expired codes (optional - can be managed by cron job)
-- DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
