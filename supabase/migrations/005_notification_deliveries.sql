-- Create notification_deliveries table for deduping email and push notifications
CREATE TABLE IF NOT EXISTS public.notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'in_app')),
  notification_type text NOT NULL,
  reminder_date date,
  summary_week_start date,
  unique_key text NOT NULL UNIQUE,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user_id ON public.notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_subscription_id ON public.notification_deliveries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_unique_key ON public.notification_deliveries(unique_key);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_type ON public.notification_deliveries(notification_type);

-- Enable RLS
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification deliveries"
  ON public.notification_deliveries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage notification deliveries"
  ON public.notification_deliveries
  FOR ALL
  USING (current_setting('role') = 'service_role' OR auth.uid() = user_id)
  WITH CHECK (current_setting('role') = 'service_role' OR auth.uid() = user_id);
