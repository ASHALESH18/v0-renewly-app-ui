-- Create notification_deliveries table for tracking and deduping email reminders
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  channel text NOT NULL, -- 'email', 'push', 'in_app'
  reminder_date date NOT NULL,
  unique_key text NOT NULL, -- For deduping: user_id-subscription_id-channel-date
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(unique_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_subscription_id ON notification_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_unique_key ON notification_deliveries(unique_key);

-- Enable RLS
ALTER TABLE notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only view/insert their own records
CREATE POLICY "Users can view own notification_deliveries" ON notification_deliveries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification_deliveries" ON notification_deliveries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert notification_deliveries" ON notification_deliveries
  FOR INSERT
  WITH CHECK (auth.jwt()->'role' = '"service_role"'::jsonb);

GRANT SELECT, INSERT ON notification_deliveries TO authenticated;
GRANT SELECT, INSERT ON notification_deliveries TO service_role;
