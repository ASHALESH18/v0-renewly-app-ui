-- Smart Capture System Tables
-- Creates tables for subscription candidate detection and automation

-- Connected accounts for email/notification integrations
CREATE TABLE IF NOT EXISTS connected_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'expired', 'error', 'pending')),
  last_sync TIMESTAMPTZ,
  webhook_status TEXT DEFAULT 'inactive' CHECK (webhook_status IN ('active', 'inactive', 'error')),
  sync_health TEXT DEFAULT 'healthy' CHECK (sync_health IN ('healthy', 'degraded', 'unhealthy')),
  
  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Sync cursors
  history_id TEXT, -- Gmail
  delta_link TEXT, -- Outlook
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, provider, email)
);

-- Enable RLS
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own connected_accounts"
  ON connected_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connected_accounts"
  ON connected_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connected_accounts"
  ON connected_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connected_accounts"
  ON connected_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Ingestion events (raw data from email/notifications)
CREATE TABLE IF NOT EXISTS ingestion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('gmail', 'outlook', 'notification_lab', 'manual')),
  source_event_id TEXT, -- External ID from source system
  
  -- Raw event data
  subject TEXT,
  body TEXT,
  sender TEXT,
  received_at TIMESTAMPTZ,
  
  -- For notification lab
  app_name TEXT,
  title TEXT,
  notification_body TEXT,
  
  -- Processing state
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'processed', 'failed')),
  processed_at TIMESTAMPTZ,
  candidate_id UUID,
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, source, source_event_id)
);

-- Enable RLS
ALTER TABLE ingestion_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own ingestion_events"
  ON ingestion_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ingestion_events"
  ON ingestion_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ingestion_events"
  ON ingestion_events FOR UPDATE
  USING (auth.uid() = user_id);

-- Subscription candidates (detected potential subscriptions)
CREATE TABLE IF NOT EXISTS subscription_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Source tracking
  source TEXT NOT NULL CHECK (source IN ('gmail', 'outlook', 'notification_lab', 'manual')),
  source_event_id TEXT,
  ingestion_event_id UUID REFERENCES ingestion_events(id) ON DELETE SET NULL,
  
  -- Detected subscription details
  provider_name TEXT NOT NULL,
  provider_logo TEXT,
  plan_name TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'INR',
  billing_cycle TEXT DEFAULT 'unknown' CHECK (billing_cycle IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'unknown')),
  
  -- Detection metadata
  confidence_score INTEGER NOT NULL DEFAULT 50 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_level TEXT NOT NULL DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'review_needed', 'added', 'ignored', 'error')),
  
  -- Evidence and context
  evidence_snippet TEXT,
  evidence_details JSONB DEFAULT '[]'::jsonb,
  
  -- Special detections
  tags TEXT[] DEFAULT '{}',
  trial_info JSONB,
  renewal_info JSONB,
  
  -- Duplicate detection
  possible_duplicate_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  possible_duplicate_name TEXT,
  
  -- Timestamps
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_candidates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own subscription_candidates"
  ON subscription_candidates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription_candidates"
  ON subscription_candidates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription_candidates"
  ON subscription_candidates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscription_candidates"
  ON subscription_candidates FOR DELETE
  USING (auth.uid() = user_id);

-- Candidate decisions (audit log of user actions)
CREATE TABLE IF NOT EXISTS candidate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES subscription_candidates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('confirm', 'ignore', 'already_tracked', 'save_for_later', 'retry')),
  
  -- If confirmed, link to created subscription
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  -- User modifications before confirm
  modifications JSONB,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE candidate_decisions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own candidate_decisions"
  ON candidate_decisions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own candidate_decisions"
  ON candidate_decisions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_status ON connected_accounts(status);

CREATE INDEX IF NOT EXISTS idx_ingestion_events_user_id ON ingestion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_events_status ON ingestion_events(status);
CREATE INDEX IF NOT EXISTS idx_ingestion_events_source ON ingestion_events(source);

CREATE INDEX IF NOT EXISTS idx_subscription_candidates_user_id ON subscription_candidates(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_candidates_status ON subscription_candidates(status);
CREATE INDEX IF NOT EXISTS idx_subscription_candidates_source ON subscription_candidates(source);
CREATE INDEX IF NOT EXISTS idx_subscription_candidates_detected_at ON subscription_candidates(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_decisions_candidate_id ON candidate_decisions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_decisions_user_id ON candidate_decisions(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_connected_accounts_updated_at ON connected_accounts;
CREATE TRIGGER update_connected_accounts_updated_at
  BEFORE UPDATE ON connected_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_candidates_updated_at ON subscription_candidates;
CREATE TRIGGER update_subscription_candidates_updated_at
  BEFORE UPDATE ON subscription_candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
