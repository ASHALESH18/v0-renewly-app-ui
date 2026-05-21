-- Create notifications table for Combo 5
-- Safe: Only creates if not exists
-- No data loss: Adds columns only

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  category text DEFAULT 'system',
  severity text DEFAULT 'info',
  title text NOT NULL,
  message text,
  action_url text,
  action_label text,
  entity_type text,
  entity_id text,
  
  -- Idempotency key for duplicate prevention
  idempotency_key text,
  
  -- Source tracking for audit and idempotency
  source text NOT NULL,
  source_id text NOT NULL,
  
  -- Metadata for flexible event data
  metadata jsonb DEFAULT '{}',
  
  -- Status tracking
  status text DEFAULT 'unread',
  read_at timestamp with time zone,
  archived_at timestamp with time zone,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  
  -- Unique constraint on source + source_id for idempotency
  CONSTRAINT unique_source_identity UNIQUE (user_id, source, source_id)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own notifications
DROP POLICY IF EXISTS users_can_view_own_notifications ON notifications;
CREATE POLICY users_can_view_own_notifications
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can mark their own notifications read
DROP POLICY IF EXISTS users_can_mark_own_read ON notifications;
CREATE POLICY users_can_mark_own_read
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert system notifications
DROP POLICY IF EXISTS service_role_can_insert ON notifications;
CREATE POLICY service_role_can_insert
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_source_identity ON notifications(user_id, source, source_id);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Create trigger for updated_at timestamp
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
