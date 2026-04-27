-- Add push notification onboarding tracking to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS push_prompt_seen_at timestamptz;

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_settings_push_prompt_seen_at 
  ON public.user_settings(push_prompt_seen_at);
