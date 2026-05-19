-- F8-lite/N1: Create persistent notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('family_invite', 'family_member_joined', 'family_member_left', 'subscription_reminder', 'payment_issue')),
  source TEXT NOT NULL CHECK (source IN ('family_invite', 'subscription', 'billing', 'system')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  action_label TEXT,
  status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- F8-lite: Unique constraint to prevent duplicate notifications
  CONSTRAINT unique_notification_per_source UNIQUE(user_id, source, source_id),
  
  -- Performance indexes
  INDEX idx_notifications_user_id ON notifications(user_id),
  INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC),
  INDEX idx_notifications_user_status ON notifications(user_id, status),
  INDEX idx_notifications_expires ON notifications(expires_at)
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- F8-lite: Users can only see their own notifications
CREATE POLICY notifications_user_policy ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- F8-lite: System can create notifications via service role
CREATE POLICY notifications_insert_service_role ON notifications
  FOR INSERT WITH CHECK (true);

-- F8-lite: Users can update their own notification status
CREATE POLICY notifications_update_status ON notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND (
    -- Allow status changes and archive
    (OLD.status IS DISTINCT FROM NEW.status) OR
    (OLD.updated_at IS DISTINCT FROM NEW.updated_at)
  ));
