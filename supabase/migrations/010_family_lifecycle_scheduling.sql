-- F8-lite: Family lifecycle scheduling
-- Adds fields to support scheduling family cancellation and downgrades at period end
-- Does not implement real Razorpay recurring billing yet

-- Add lifecycle scheduling fields to family_groups
ALTER TABLE public.family_groups
ADD COLUMN IF NOT EXISTS scheduled_action TEXT CHECK (scheduled_action IN ('none', 'cancel_at_period_end', 'downgrade_to_pro_at_period_end', NULL)),
ADD COLUMN IF NOT EXISTS scheduled_action_reason TEXT,
ADD COLUMN IF NOT EXISTS scheduled_action_at TIMESTAMPTZ NULL;

-- Index for lifecycle queries
CREATE INDEX IF NOT EXISTS idx_family_groups_scheduled_action ON public.family_groups(scheduled_action)
WHERE scheduled_action IS NOT NULL AND scheduled_action != 'none';

-- Comment for clarity
COMMENT ON COLUMN public.family_groups.scheduled_action IS 'Lifecycle action to execute at current_period_end. Possible values: cancel_at_period_end, downgrade_to_pro_at_period_end';
COMMENT ON COLUMN public.family_groups.scheduled_action_at IS 'Timestamp when the scheduled action was requested by owner';
