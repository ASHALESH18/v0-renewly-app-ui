-- F10: Family lifecycle enforcement and invite idempotency
-- Adds columns to support safe Family lifecycle enforcement with period-end actions
-- Adds columns for tracking extra-seat payment intents in family invites
-- Safe to run multiple times - uses "IF NOT EXISTS" or "IF NOT ALREADY EXISTS" patterns

-- 1. Add extra_seat_payment_intent_id to family_invites if not already present
ALTER TABLE public.family_invites
  ADD COLUMN IF NOT EXISTS extra_seat_payment_intent_id uuid null
  REFERENCES public.family_extra_seat_payment_intents(id) ON DELETE SET NULL;

-- Unique index for extra-seat payment intent lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_family_invites_extra_seat_payment_intent_id_unique
  ON public.family_invites(extra_seat_payment_intent_id)
  WHERE extra_seat_payment_intent_id IS NOT NULL;

-- Composite index for family group + payment intent lookups
CREATE INDEX IF NOT EXISTS idx_family_invites_family_extra_payment_lookup
  ON public.family_invites(family_group_id, extra_seat_payment_intent_id)
  WHERE extra_seat_payment_intent_id IS NOT NULL;

-- 2. Add lifecycle enforcement columns to family_groups if not already present
ALTER TABLE public.family_groups
  ADD COLUMN IF NOT EXISTS scheduled_action_created_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS scheduled_action_effective_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz NULL,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz NULL;

-- 3. Add indexes for efficient lifecycle queries
CREATE INDEX IF NOT EXISTS idx_family_groups_scheduled_action_due
  ON public.family_groups(status, scheduled_action, current_period_end)
  WHERE scheduled_action IS NOT NULL 
    AND scheduled_action IN ('cancel_at_period_end', 'downgrade_to_pro_at_period_end');

CREATE INDEX IF NOT EXISTS idx_family_members_group_status
  ON public.family_members(family_group_id, status);

CREATE INDEX IF NOT EXISTS idx_family_invites_group_status
  ON public.family_invites(family_group_id, status);

-- Comments for clarity
COMMENT ON COLUMN public.family_groups.scheduled_action_created_at 
  IS 'Timestamp when owner requested the scheduled action (cancel or downgrade)';
COMMENT ON COLUMN public.family_groups.scheduled_action_effective_at 
  IS 'When the scheduled action will take effect (typically current_period_end)';
COMMENT ON COLUMN public.family_groups.current_period_start 
  IS 'Start of current billing period for this family group';
COMMENT ON COLUMN public.family_groups.current_period_end 
  IS 'End of current billing period - when scheduled actions execute';
COMMENT ON COLUMN public.family_invites.extra_seat_payment_intent_id 
  IS 'Reference to payment intent for extra-seat add-on if this is an extra-seat invite';
