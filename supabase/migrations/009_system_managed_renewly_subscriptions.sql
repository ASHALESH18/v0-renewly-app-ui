-- System-Managed Renewly Subscriptions
-- Adds columns to subscriptions table to support automatic Renewly Pro/Family subscriptions
-- F1.1/F2 Batch: Foundation for system-managed subscription tracking

-- Add columns to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS is_system_managed boolean not null default false,
ADD COLUMN IF NOT EXISTS managed_plan text null,
ADD COLUMN IF NOT EXISTS system_source text null,
ADD COLUMN IF NOT EXISTS managed_subscription_key text null,
ADD COLUMN IF NOT EXISTS billing_owner_user_id uuid null references auth.users(id) on delete set null,
ADD COLUMN IF NOT EXISTS family_group_id uuid null references public.family_groups(id) on delete set null,
ADD COLUMN IF NOT EXISTS covered_by_family boolean not null default false,
ADD COLUMN IF NOT EXISTS system_metadata jsonb not null default '{}'::jsonb;

-- Add check constraints for managed_plan and system_source
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_managed_plan CHECK (managed_plan IS NULL OR managed_plan IN ('pro', 'family')),
ADD CONSTRAINT check_system_source CHECK (system_source IS NULL OR system_source IN ('renewly_billing'));

-- Add unique index for managed_subscription_key (only when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_managed_subscription_key
ON public.subscriptions(managed_subscription_key)
WHERE managed_subscription_key IS NOT NULL;

-- Add index for user + system-managed lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_system_managed
ON public.subscriptions(user_id, is_system_managed);

-- Add index for managed plan lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_managed_plan
ON public.subscriptions(managed_plan)
WHERE is_system_managed = true;

-- Add index for family group lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_family_group_id
ON public.subscriptions(family_group_id)
WHERE family_group_id IS NOT NULL;

-- Add index for billing owner lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_owner
ON public.subscriptions(billing_owner_user_id)
WHERE billing_owner_user_id IS NOT NULL;

-- Comments explaining system-managed rows
COMMENT ON COLUMN public.subscriptions.is_system_managed IS 'True if created by Renewly billing system. Users cannot edit/delete these subscriptions directly.';
COMMENT ON COLUMN public.subscriptions.managed_plan IS 'Plan associated with this system-managed subscription: ''pro'' or ''family''. Null for user-created subscriptions.';
COMMENT ON COLUMN public.subscriptions.system_source IS 'Source that created this subscription. Currently only ''renewly_billing'' is supported.';
COMMENT ON COLUMN public.subscriptions.managed_subscription_key IS 'Unique key for upserts: e.g., ''renewly:pro:user-id'' or ''renewly:family:owner:group-id:user-id''.';
COMMENT ON COLUMN public.subscriptions.billing_owner_user_id IS 'User who is billed for this subscription (owner of pro/family plan).';
COMMENT ON COLUMN public.subscriptions.family_group_id IS 'Family group this subscription is associated with (if any).';
COMMENT ON COLUMN public.subscriptions.covered_by_family IS 'True if member subscription is covered by family owner''s payment.';
COMMENT ON COLUMN public.subscriptions.system_metadata IS 'Additional metadata stored by system (e.g., sync timestamps, notes).';
